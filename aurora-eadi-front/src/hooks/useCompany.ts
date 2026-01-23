// import { useMutation } from "@tanstack/react-query";
// import { registerCompanies } from "@/services/companies/companies.service";
// import { CreateCompanyDTO, CreateUserDTO } from "@/types";

// export const useCompanies = () => {
//   return useMutation({
//     mutationFn: async ({ company, user }: { company: CreateCompanyDTO; user: CreateUserDTO }) => {
//       return await registerCompanies.create({ company, user });
//     },
//     onError: (error: any) => {
//       console.error('Erro no registro:', error.message);
//     },
//   });
// };