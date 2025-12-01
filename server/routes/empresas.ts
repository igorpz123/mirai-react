import { Router } from 'express'
import { auditMiddleware } from '../middleware/audit'
import { extractUserId } from '../middleware/permissions'
import { getCompaniesByResponsavel, getCompaniesByResponsavelAndUnidade, getCompaniesByUnidade, getCompanyByCNPJ, createCompany, getAllCompanies, getCompanyById, updateCompany, generateAutoTasksForUnit, getJobStatus } from '../controllers/CompanyController'

const router = Router()

// Extrair userId de todas as requisições para popular req.user
router.use(extractUserId);

// Aplicar auditoria automática em rotas de modificação (POST, PUT, PATCH, DELETE)
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return auditMiddleware('company')(req, res, next);
  }
  next();
});

router.get('/responsavel/:responsavel_id', getCompaniesByResponsavel)
router.get('/unidade/:unidade_id/responsavel/:responsavel_id', getCompaniesByResponsavelAndUnidade)
router.get('/unidade/:unidade_id', getCompaniesByUnidade)
router.get('/cnpj/:cnpj', getCompanyByCNPJ)
router.get('/jobs/:jobId', getJobStatus)
router.post('/unidade/:unidade_id/auto-tarefas', generateAutoTasksForUnit)
router.post('/', createCompany)
router.get('/', getAllCompanies)
router.get('/:id', getCompanyById)
router.put('/:id', updateCompany)

export default router
