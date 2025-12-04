import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import forge from 'node-forge';

// =============================================
// Tipos e Interfaces
// =============================================

export type SignatureType = 'digital' | 'eletronica';
export type SignatureStatus = 'pendente' | 'assinado' | 'rejeitado' | 'expirado';

export interface DocumentSignature {
  id?: number;
  document_id: number;
  user_id: number;
  tipo: SignatureType;
  status?: SignatureStatus;
  ordem?: number;
  
  // Digital
  certificado_cn?: string;
  certificado_serial?: string;
  certificado_issuer?: string;
  certificado_validade?: Date;
  certificado_arquivo?: string;
  hash_documento?: string;
  assinatura_digital?: string;
  
  // Eletrônica
  ip_address?: string;
  user_agent?: string;
  geolocalizacao?: string;
  token_verificacao?: string;
  
  // Metadados
  motivo?: string;
  observacoes?: string;
  signed_at?: Date;
  expires_at?: Date;
}

export interface CertificateInfo {
  commonName: string;
  serialNumber: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  publicKey: string;
}

// =============================================
// Serviço de Assinaturas
// =============================================

class SignatureService {
  private certificatesDir = path.join(__dirname, '../uploads/certificates');

  constructor() {
    this.ensureCertificatesDirExists();
  }

  private async ensureCertificatesDirExists() {
    try {
      await fs.mkdir(this.certificatesDir, { recursive: true });
    } catch (error) {
      console.error('[SignatureService] Erro ao criar diretório de certificados:', error);
    }
  }

  // =============================================
  // Assinatura Digital (ICP-Brasil)
  // =============================================

  /**
   * Valida certificado digital (formato PEM ou PFX/P12)
   */
  async validateCertificate(certificateBuffer: Buffer, password?: string): Promise<CertificateInfo | null> {
    try {
      let cert: forge.pki.Certificate;

      // Tentar como PEM primeiro
      try {
        const pem = certificateBuffer.toString('utf8');
        cert = forge.pki.certificateFromPem(pem);
      } catch {
        // Se não for PEM, tentar como PFX/P12
        if (!password) {
          throw new Error('Senha necessária para certificado PFX/P12');
        }
        const asn1 = forge.asn1.fromDer(certificateBuffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
        const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = bags[forge.pki.oids.certBag];
        if (!certBag || certBag.length === 0) {
          throw new Error('Nenhum certificado encontrado no arquivo');
        }
        cert = certBag[0].cert!;
      }

      // Extrair informações
      const subject = cert.subject.attributes;
      const issuer = cert.issuer.attributes;
      
      const cnAttr = subject.find(attr => attr.shortName === 'CN');
      const cn = typeof cnAttr?.value === 'string' ? cnAttr.value : String(cnAttr?.value || 'Desconhecido');
      const serialNumber = cert.serialNumber;
      const issuerName = issuer.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
      
      const validFrom = cert.validity.notBefore;
      const validTo = cert.validity.notAfter;
      
      // Verificar se está válido
      const now = new Date();
      if (now < validFrom || now > validTo) {
        console.warn('[SignatureService] Certificado fora do período de validade');
        return null;
      }

      // Extrair chave pública
      const publicKeyPem = forge.pki.publicKeyToPem(cert.publicKey);

      return {
        commonName: cn,
        serialNumber: serialNumber,
        issuer: issuerName,
        validFrom: validFrom,
        validTo: validTo,
        publicKey: publicKeyPem,
      };
    } catch (error) {
      console.error('[SignatureService] Erro ao validar certificado:', error);
      return null;
    }
  }

  /**
   * Gera hash SHA-256 do documento
   */
  async generateDocumentHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * Assina documento digitalmente com certificado
   */
  async signDocumentDigitally(
    documentId: number,
    userId: number,
    certificateBuffer: Buffer,
    privateKeyBuffer: Buffer,
    password?: string,
    metadata?: {
      motivo?: string;
      observacoes?: string;
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<number> {
    // Validar certificado
    const certInfo = await this.validateCertificate(certificateBuffer, password);
    if (!certInfo) {
      throw new Error('Certificado inválido ou expirado');
    }

    // Buscar caminho do documento
    const [docs] = await pool.execute<RowDataPacket[]>(
      'SELECT arquivo_path FROM documents WHERE id = ?',
      [documentId]
    );
    if (docs.length === 0) {
      throw new Error('Documento não encontrado');
    }

    const documentPath = path.join(__dirname, '../uploads/documents', docs[0].arquivo_path);
    
    // Gerar hash do documento
    const docHash = await this.generateDocumentHash(documentPath);

    // Assinar hash com chave privada
    let signature: string;
    try {
      const privateKey = forge.pki.privateKeyFromPem(privateKeyBuffer.toString('utf8'));
      const md = forge.md.sha256.create();
      md.update(docHash, 'utf8');
      const signatureBytes = privateKey.sign(md);
      signature = forge.util.encode64(signatureBytes);
    } catch (error) {
      console.error('[SignatureService] Erro ao assinar documento:', error);
      throw new Error('Erro ao gerar assinatura digital');
    }

    // Salvar certificado
    const certFilename = `cert_${Date.now()}_${userId}.pem`;
    const certPath = path.join(this.certificatesDir, certFilename);
    await fs.writeFile(certPath, certificateBuffer);

    // Registrar assinatura no banco
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO document_signatures (
        document_id, user_id, tipo, status, hash_documento, assinatura_digital,
        certificado_cn, certificado_serial, certificado_issuer, certificado_validade,
        certificado_arquivo, motivo, observacoes, ip_address, user_agent, signed_at
      ) VALUES (?, ?, 'digital', 'assinado', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        documentId,
        userId,
        docHash,
        signature,
        certInfo.commonName,
        certInfo.serialNumber,
        certInfo.issuer,
        certInfo.validTo,
        certFilename,
        metadata?.motivo || null,
        metadata?.observacoes || null,
        metadata?.ip_address || null,
        metadata?.user_agent || null,
      ]
    );

    // Atualizar contador de assinaturas do documento
    await this.updateDocumentSignatureCount(documentId);

    return result.insertId;
  }

  /**
   * Verifica assinatura digital
   */
  async verifyDigitalSignature(signatureId: number): Promise<boolean> {
    const [signatures] = await pool.execute<RowDataPacket[]>(
      `SELECT ds.*, d.arquivo_path
       FROM document_signatures ds
       JOIN documents d ON ds.document_id = d.id
       WHERE ds.id = ? AND ds.tipo = 'digital'`,
      [signatureId]
    );

    if (signatures.length === 0) {
      throw new Error('Assinatura não encontrada');
    }

    const sig = signatures[0];
    
    // Recalcular hash do documento
    const documentPath = path.join(__dirname, '../uploads/documents', sig.arquivo_path);
    const currentHash = await this.generateDocumentHash(documentPath);

    // Verificar se hash corresponde
    if (currentHash !== sig.hash_documento) {
      console.warn('[SignatureService] Hash do documento não corresponde - documento foi modificado');
      return false;
    }

    // Carregar certificado
    const certPath = path.join(this.certificatesDir, sig.certificado_arquivo);
    const certBuffer = await fs.readFile(certPath);
    const certInfo = await this.validateCertificate(certBuffer);

    if (!certInfo) {
      console.warn('[SignatureService] Certificado inválido ou expirado');
      return false;
    }

    // Verificar assinatura com chave pública
    try {
      const publicKey = forge.pki.publicKeyFromPem(certInfo.publicKey);
      const md = forge.md.sha256.create();
      md.update(sig.hash_documento, 'utf8');
      const signatureBytes = forge.util.decode64(sig.assinatura_digital);
      return publicKey.verify(md.digest().bytes(), signatureBytes);
    } catch (error) {
      console.error('[SignatureService] Erro ao verificar assinatura:', error);
      return false;
    }
  }

  // =============================================
  // Assinatura Eletrônica (Simples)
  // =============================================

  /**
   * Cria solicitação de assinatura eletrônica
   */
  async createElectronicSignatureRequest(
    documentId: number,
    userId: number,
    expiresInDays: number = 7,
    ordem?: number
  ): Promise<string> {
    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Registrar no banco
    await pool.execute(
      `INSERT INTO document_signatures (
        document_id, user_id, tipo, status, token_verificacao, expires_at, ordem
      ) VALUES (?, ?, 'eletronica', 'pendente', ?, ?, ?)`,
      [documentId, userId, token, expiresAt, ordem || 0]
    );

    return token;
  }

  /**
   * Assina documento eletronicamente
   */
  async signDocumentElectronically(
    token: string,
    metadata: {
      ip_address?: string;
      user_agent?: string;
      geolocalizacao?: string;
      motivo?: string;
      observacoes?: string;
    }
  ): Promise<boolean> {
    // Buscar assinatura pendente
    const [signatures] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM document_signatures 
       WHERE token_verificacao = ? AND status = 'pendente' AND tipo = 'eletronica'`,
      [token]
    );

    if (signatures.length === 0) {
      throw new Error('Token de assinatura inválido ou já utilizado');
    }

    const signature = signatures[0];

    // Verificar expiração
    if (signature.expires_at && new Date() > new Date(signature.expires_at)) {
      await pool.execute(
        'UPDATE document_signatures SET status = ? WHERE id = ?',
        ['expirado', signature.id]
      );
      throw new Error('Token de assinatura expirado');
    }

    // Registrar assinatura
    await pool.execute(
      `UPDATE document_signatures SET
        status = 'assinado',
        signed_at = NOW(),
        ip_address = ?,
        user_agent = ?,
        geolocalizacao = ?,
        motivo = ?,
        observacoes = ?
      WHERE id = ?`,
      [
        metadata.ip_address || null,
        metadata.user_agent || null,
        metadata.geolocalizacao || null,
        metadata.motivo || null,
        metadata.observacoes || null,
        signature.id,
      ]
    );

    // Atualizar contador de assinaturas do documento
    await this.updateDocumentSignatureCount(signature.document_id);

    return true;
  }

  /**
   * Rejeita assinatura
   */
  async rejectSignature(token: string, motivo: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE document_signatures SET status = 'rejeitado', motivo = ? 
       WHERE token_verificacao = ? AND status = 'pendente'`,
      [motivo, token]
    );
    return result.affectedRows > 0;
  }

  // =============================================
  // Consultas
  // =============================================

  async getDocumentSignatures(documentId: number): Promise<DocumentSignature[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ds.*, u.nome, u.sobrenome, u.email
       FROM document_signatures ds
       LEFT JOIN usuarios u ON ds.user_id = u.id
       WHERE ds.document_id = ?
       ORDER BY ds.ordem, ds.created_at`,
      [documentId]
    );
    return rows as DocumentSignature[];
  }

  async getSignatureById(id: number): Promise<DocumentSignature | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM document_signatures WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] as DocumentSignature : null;
  }

  async getPendingSignatures(userId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ds.*, d.nome as document_nome, d.tipo as document_tipo
       FROM document_signatures ds
       JOIN documents d ON ds.document_id = d.id
       WHERE ds.user_id = ? AND ds.status = 'pendente'
       ORDER BY ds.expires_at ASC`,
      [userId]
    );
    return rows;
  }

  // =============================================
  // Helpers
  // =============================================

  private async updateDocumentSignatureCount(documentId: number): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_requeridas,
        SUM(CASE WHEN status = 'assinado' THEN 1 ELSE 0 END) as total_concluidas
       FROM document_signatures
       WHERE document_id = ?`,
      [documentId]
    );

    const { total_requeridas, total_concluidas } = rows[0];

    await pool.execute(
      `UPDATE documents SET 
        total_assinaturas_requeridas = ?,
        total_assinaturas_concluidas = ?,
        status = CASE 
          WHEN ? = ? AND ? > 0 THEN 'assinado'
          ELSE status
        END
      WHERE id = ?`,
      [total_requeridas, total_concluidas, total_concluidas, total_requeridas, total_requeridas, documentId]
    );
  }

  /**
   * Marca assinaturas expiradas
   */
  async markExpiredSignatures(): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE document_signatures 
       SET status = 'expirado' 
       WHERE status = 'pendente' AND expires_at < NOW()`
    );
    return result.affectedRows;
  }
}

export const signatureService = new SignatureService();
