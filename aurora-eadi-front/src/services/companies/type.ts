export type companyType = {
  // UUID (Identificador Universalmente Único)
  id: string;

  // Cadastro Nacional da Pessoa Jurídica - String formatada
  cnpj: string;

  // Nome fantasia da empresa
  fantasyName: string;

  // Razão social da empresa
  socialReason: string;

  // Código de Endereçamento Postal - String de 8 dígitos
  zipCode: string;

  // Endereço de e-mail (apesar da chave "address", o valor parece ser um e-mail)
  address: string;

  // Número do endereço - String (para preservar zeros à esquerda, se houver, ou tratar como alfanumérico)
  number: string;

  // Complemento do endereço
  complement: string;

  // Bairro
  neighborhood: string;

  // Cidade
  city: string;

  // Estado (sigla ou nome completo)
  state: string;

  // Telefone de contato - String (para preservar formatação ou zeros à esquerda)
  phone: string;

  // Status da empresa (pode ser um Enum, mas é um string no exemplo)
  status: 'ACTIVE' | 'INACTIVE' | string; // Exemplo de 'string literal' ou 'enum'

  // Data de criação - ISO 8601 string
  createdAt: string;

  // Data de última atualização - ISO 8601 string
  updatedAt: string;
}