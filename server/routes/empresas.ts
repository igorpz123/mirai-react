import { Router } from 'express'
import { getCompaniesByResponsavel, getCompaniesByResponsavelAndUnidade, getCompaniesByUnidade, getCompanyByCNPJ, createCompany, getAllCompanies, getCompanyById, updateCompany, generateAutoTasksForUnit, getJobStatus } from '../controllers/CompanyController'

const router = Router()

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
