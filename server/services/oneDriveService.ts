import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';

// Inicialização lazy do cliente MSAL (apenas quando realmente for usado)
let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    // Verificar se as credenciais do Azure estão configuradas
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !tenantId || !clientSecret) {
      throw new Error(
        'Credenciais do Azure AD não configuradas. Configure AZURE_CLIENT_ID, AZURE_TENANT_ID e AZURE_CLIENT_SECRET no arquivo .env'
      );
    }

    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    };

    msalClient = new ConfidentialClientApplication(msalConfig);
  }

  return msalClient;
}

/**
 * Obter token de acesso usando credenciais de aplicativo
 */
async function getAccessToken(): Promise<string> {
  try {
    const client = getMsalClient();
    
    const tokenRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await client.acquireTokenByClientCredential(tokenRequest);
    
    if (!response || !response.accessToken) {
      throw new Error('Falha ao obter token de acesso');
    }

    return response.accessToken;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    throw error;
  }
}

/**
 * Criar cliente do Microsoft Graph autenticado
 */
async function getGraphClient(): Promise<Client> {
  const accessToken = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Listar arquivos de uma pasta específica do OneDrive
 * @param folderPath - Caminho da pasta (ex: "/Documentos Clientes/Empresa XYZ")
 */
export async function listOneDriveFiles(folderPath: string) {
  try {
    const client = await getGraphClient();

    // Buscar arquivos na pasta especificada
    const response = await client
      .api(`/me/drive/root:${folderPath}:/children`)
      .get();

    return response.value.map((item: any) => ({
      id: item.id,
      nome: item.name,
      tipo: item.file ? item.file.mimeType : 'folder',
      tamanho: item.size,
      data_modificacao: item.lastModifiedDateTime,
      downloadUrl: item['@microsoft.graph.downloadUrl'],
      webUrl: item.webUrl,
    }));
  } catch (error: any) {
    console.error('Erro ao listar arquivos do OneDrive:', error);
    throw new Error(`Erro ao acessar OneDrive: ${error.message}`);
  }
}

/**
 * Obter link de download direto de um arquivo
 * @param fileId - ID do arquivo no OneDrive
 */
export async function getOneDriveFileDownloadUrl(fileId: string): Promise<string> {
  try {
    const client = await getGraphClient();

    const response = await client
      .api(`/me/drive/items/${fileId}`)
      .get();

    return response['@microsoft.graph.downloadUrl'];
  } catch (error: any) {
    console.error('Erro ao obter URL de download:', error);
    throw new Error(`Erro ao obter arquivo: ${error.message}`);
  }
}

/**
 * Fazer download de um arquivo do OneDrive
 * @param fileId - ID do arquivo no OneDrive
 */
export async function downloadOneDriveFile(fileId: string): Promise<Buffer> {
  try {
    const downloadUrl = await getOneDriveFileDownloadUrl(fileId);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Erro no download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error('Erro ao fazer download do arquivo:', error);
    throw new Error(`Erro no download: ${error.message}`);
  }
}

/**
 * Buscar arquivos de um cliente específico
 * @param empresaNome - Nome da empresa para buscar pasta
 */
export async function getClientDocuments(empresaNome: string) {
  try {
    // Assume que os documentos estão organizados por empresa
    // Ex: /Documentos Clientes/[Nome da Empresa]/
    const folderPath = `/Documentos Clientes/${empresaNome}`;
    
    return await listOneDriveFiles(folderPath);
  } catch (error: any) {
    console.error('Erro ao buscar documentos do cliente:', error);
    
    // Se a pasta não existir, retornar array vazio
    if (error.message.includes('itemNotFound')) {
      return [];
    }
    
    throw error;
  }
}

/**
 * Criar link de compartilhamento para um arquivo
 * @param fileId - ID do arquivo no OneDrive
 * @param type - Tipo de link: 'view' ou 'edit'
 */
export async function createSharingLink(fileId: string, type: 'view' | 'edit' = 'view') {
  try {
    const client = await getGraphClient();

    const response = await client
      .api(`/me/drive/items/${fileId}/createLink`)
      .post({
        type: type,
        scope: 'organization', // Apenas usuários da organização
      });

    return {
      link: response.link.webUrl,
      expirationDateTime: response.expirationDateTime,
    };
  } catch (error: any) {
    console.error('Erro ao criar link de compartilhamento:', error);
    throw new Error(`Erro ao compartilhar arquivo: ${error.message}`);
  }
}
