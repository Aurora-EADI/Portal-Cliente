import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Company, Document, UserRole, DocumentStatus, CompanyStatus, CreateCompanyDTO, CreateUserDTO } from '../types';
import { authService, documentService, companyService } from '../services/api';

/**
 * Context Definition
 */
interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  
  // Auth Actions
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean, error?: string }>;
  logout: () => void;
  registerCompany: (company: CreateCompanyDTO, user: CreateUserDTO) => Promise<void>;
  
  // Data Fetching (Exposed for components to trigger refreshes)
  refreshData: () => void;

  // Data Getters (Cached in context for simplicity in this demo)
  documents: Document[];
  suppliers: { company: Company, responsible: User }[]; // Combined view for Admin
  
  // Operations
  uploadDocument: (file: File, name: string) => Promise<void>;
  updateDocumentStatus: (docId: string, status: DocumentStatus, reason?: string) => Promise<void>;
  updateCompanyStatus: (companyId: string, status: CompanyStatus) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [suppliers, setSuppliers] = useState<{ company: Company, responsible: User }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Effect: Fetch data when user logs in or refresh is triggered
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        if (currentUser.role === UserRole.ADMIN) {
          // Admin sees all suppliers and documents
          const [allDocs, allSuppliers] = await Promise.all([
            documentService.getAll(),
            companyService.getAllWithResponsible()
          ]);
          setDocuments(allDocs);
          setSuppliers(allSuppliers);
        } else {
          // Supplier sees only their company documents
          if (currentUser.companyId) {
            const myDocs = await documentService.getByCompany(currentUser.companyId);
            setDocuments(myDocs);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, refreshTrigger]);

  // --- Actions ---

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const user = await authService.login(email, password, role);
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setDocuments([]);
    setSuppliers([]);
  };

  const registerCompany = async (companyData: CreateCompanyDTO, userData: CreateUserDTO) => {
    setIsLoading(true);
    try {
      await authService.register({ company: companyData, user: userData });
      // NOTE: We do NOT automatically log them in anymore, as they are PENDING
      // setCurrentUser(newUser); 
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File, name: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await documentService.upload(file, name, currentUser);
      setRefreshTrigger(prev => prev + 1); // Trigger reload
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocumentStatus = async (docId: string, status: DocumentStatus, reason?: string) => {
    setIsLoading(true);
    try {
      await documentService.updateStatus(docId, status, reason);
      setRefreshTrigger(prev => prev + 1); // Trigger reload
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanyStatus = async (companyId: string, status: CompanyStatus) => {
    setIsLoading(true);
    try {
      await companyService.updateStatus(companyId, status);
      setRefreshTrigger(prev => prev + 1); // Trigger reload
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      isLoading,
      documents,
      suppliers,
      login, 
      logout, 
      registerCompany, 
      uploadDocument, 
      updateDocumentStatus,
      updateCompanyStatus,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};