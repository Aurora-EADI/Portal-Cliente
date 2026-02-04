export interface TypeContainer {
  id: number | string;
  entryNumber: string;
  containerNumber: string;
  abreviatura: string;
  status: string;
  entryDate: Date | string;
  exitDate: Date | string | null;
  carrier: string;
  licensePlate: string;
  beneficiario: string;
  motorista: string;
  tempo_p: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
