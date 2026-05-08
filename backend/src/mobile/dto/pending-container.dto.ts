export class PendingContainerDto {
  entryNumber: number;
  entryDate: Date;
  exitDate?: Date;
  status: string;
  tipoEntrada: string;
  carrier: string;
  abreviatura?: string;
  licensePlate?: string;
  licensePlateBoogie?: string;
  containerNumber: string;
  lacre?: string;
  beneficiario?: string;
  motorista?: string;
  cpfMotorista?: string;
  tempoPermanencia: number;
  priority: 'low' | 'medium' | 'high';
}
