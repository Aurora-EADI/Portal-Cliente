import { User, Company, Document, UserRole, DocumentStatus, CompanyStatus, CreateCompanyDTO, CreateUserDTO } from '../types';

const DELAY_MS = 600;
const DB_KEYS = {
  USERS: 'docflow_users',
  COMPANIES: 'docflow_companies',
  DOCUMENTS: 'docflow_documents'
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getDb = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setDb = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// Inicialização do Banco Mock
const initializeDB = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const admin: User = {
      id: 'admin-uuid',
      name: 'Admin Master',
      email: 'admin@docflow.com',
      role: UserRole.ADMIN,
      password: '123456'
    };
    
    const demoUser: User = {
      id: 'supplier-demo-uuid',
      name: 'João Silva',
      email: 'joao@tech.com',
      role: UserRole.SUPPLIER,
      companyId: 'demo-company-id',
      password: '123456'
    };

    const demoCompany: Company = {
        id: 'demo-company-id',
        cnpj: '12.345.678/0001-99',
        fantasyName: 'Tech Solutions Ltda',
        socialReason: 'Tech Solutions Comércio e Serviços Ltda',
        zipCode: '69000-000',
        address: 'Av. Torquato Tapajós',
        number: '123',
        neighborhood: 'Flores',
        city: 'Manaus',
        state: 'AM',
        phone: '(92) 99999-9999',
        status: CompanyStatus.ACTIVE,
        createdAt: new Date().toISOString()
    };

    setDb(DB_KEYS.USERS, [admin, demoUser]);
    setDb(DB_KEYS.COMPANIES, [demoCompany]);
    setDb(DB_KEYS.DOCUMENTS, []);
  }
};
initializeDB();

// --- ENDPOINTS ---

export const authService = {
  login: async (email: string, password: string, role: UserRole) => {
    // AXIOS: return apiClient.post('/auth/login', { email, password, role });
    await delay(DELAY_MS);
    const users = getDb<User>(DB_KEYS.USERS);
    
    const user = users.find(u => u.email === email && u.role === role);
    if (!user) throw new Error('Usuário não encontrado.');
    if (user.password && user.password !== password) throw new Error('Senha incorreta.');

    if (user.role === UserRole.SUPPLIER && user.companyId) {
      const companies = getDb<Company>(DB_KEYS.COMPANIES);
      const company = companies.find(c => c.id === user.companyId);
      if (company?.status === CompanyStatus.PENDING) throw new Error('Cadastro em análise.');
      if (company?.status === CompanyStatus.REJECTED) throw new Error('Cadastro recusado.');
    }
    return user;
  },

  register: async (payload: { company: CreateCompanyDTO, user: CreateUserDTO }) => {
    // AXIOS: return apiClient.post('/auth/register', payload);
    await delay(DELAY_MS);
    const companies = getDb<Company>(DB_KEYS.COMPANIES);
    const users = getDb<User>(DB_KEYS.USERS);

    if (users.some(u => u.email === payload.user.email)) throw new Error("Email já cadastrado.");

    const newCompany: Company = {
      ...payload.company,
      id: crypto.randomUUID(),
      status: CompanyStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    const newUser: User = {
      ...payload.user,
      id: crypto.randomUUID(),
      role: UserRole.SUPPLIER,
      companyId: newCompany.id,
      password: payload.user.password
    };

    setDb(DB_KEYS.COMPANIES, [...companies, newCompany]);
    setDb(DB_KEYS.USERS, [...users, newUser]);
    return newUser;
  }
};

export const documentService = {
  getAll: async () => {
    // AXIOS: return apiClient.get('/documents');
    await delay(DELAY_MS / 2);
    return getDb<Document>(DB_KEYS.DOCUMENTS).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  getByCompany: async (companyId: string) => {
    // AXIOS: return apiClient.get(`/documents?companyId=${companyId}`);
    await delay(DELAY_MS / 2);
    return getDb<Document>(DB_KEYS.DOCUMENTS)
      .filter(d => d.companyId === companyId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  upload: async (file: File, name: string, user: User) => {
    // AXIOS: 
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('name', name);
    // return apiClient.post('/documents', formData);
    
    await delay(DELAY_MS);
    if (!user.companyId) throw new Error("User has no company");
    const docs = getDb<Document>(DB_KEYS.DOCUMENTS);
    const newDoc: Document = {
      id: crypto.randomUUID(),
      userId: user.id,
      companyId: user.companyId,
      name: name,
      fileType: file.name.split('.').pop()?.toLowerCase() as any || 'pdf',
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: DocumentStatus.PENDING
    };
    setDb(DB_KEYS.DOCUMENTS, [...docs, newDoc]);
    return newDoc;
  },

  updateStatus: async (id: string, status: DocumentStatus, reason?: string) => {
    // AXIOS: return apiClient.patch(`/documents/${id}/status`, { status, reason });
    await delay(DELAY_MS);
    const docs = getDb<Document>(DB_KEYS.DOCUMENTS);
    const index = docs.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Document not found");
    
    docs[index] = { ...docs[index], status, rejectionReason: reason };
    setDb(DB_KEYS.DOCUMENTS, docs);
    return docs[index];
  }
};

export const companyService = {
  getAllWithResponsible: async () => {
    // AXIOS: return apiClient.get('/companies/details');
    await delay(DELAY_MS);
    const companies = getDb<Company>(DB_KEYS.COMPANIES);
    const users = getDb<User>(DB_KEYS.USERS);
    return companies.map(comp => ({
      company: comp,
      responsible: users.find(u => u.companyId === comp.id) || users[0]
    }));
  },

  updateStatus: async (id: string, status: CompanyStatus) => {
    // AXIOS: return apiClient.patch(`/companies/${id}/status`, { status });
    await delay(DELAY_MS);
    const companies = getDb<Company>(DB_KEYS.COMPANIES);
    const index = companies.findIndex(c => c.id === id);
    if (index !== -1) {
      companies[index].status = status;
      setDb(DB_KEYS.COMPANIES, companies);
    }
  }
};