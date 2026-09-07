import { createHttpClient } from './http';

// Route Handlers do proprio Next (mesma origem). Camada legada: agendamento,
// auth, convites. Migra para o Nest numa fase posterior.
export const api = createHttpClient(process.env.NEXT_PUBLIC_API_URL || '/api');

export default api;
