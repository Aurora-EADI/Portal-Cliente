import { useState, useCallback } from 'react';
import { companiesService } from '@/services/companies/companies.service';
import { Company } from '@/types/company';

export const useCnpjLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const lookup = useCallback(async (cnpj: string) => {
    if (!cnpj || cnpj.trim() === '') {
      setError('CNPJ não informado');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setCompany(null);

    try {
      const data = await companiesService.findByCnpj(cnpj);
      setCompany(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao consultar CNPJ';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setCompany(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    lookup,
    clear,
    isLoading,
    error,
    company,
  };
};
