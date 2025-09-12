import { Router } from 'express'
import { getCompaniesByResponsavel, getCompaniesByResponsavelAndUnidade } from '../controllers/CompanyController'

const router = Router()

router.get('/responsavel/:responsavel_id', getCompaniesByResponsavel)
router.get('/unidade/:unidade_id/responsavel/:responsavel_id', getCompaniesByResponsavelAndUnidade)

export default router
