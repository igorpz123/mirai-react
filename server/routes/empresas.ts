import { Router } from 'express'
import { getCompaniesByResponsavel, getCompaniesByResponsavelAndUnidade, getCompaniesByUnidade, getCompanyByCNPJ, createCompany } from '../controllers/CompanyController'

const router = Router()

router.get('/responsavel/:responsavel_id', getCompaniesByResponsavel)
router.get('/unidade/:unidade_id/responsavel/:responsavel_id', getCompaniesByResponsavelAndUnidade)
router.get('/unidade/:unidade_id', getCompaniesByUnidade)
router.get('/cnpj/:cnpj', getCompanyByCNPJ)
router.post('/', createCompany)

export default router
