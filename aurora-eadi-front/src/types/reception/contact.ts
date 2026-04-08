  export interface ReceptionContact {
  id: string;
  name: string;
  position: string;
  department: string;
  extension?: string;
  mobile?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDto {
  name: string;
  position: string;
  department: string;
  extension?: string;
  mobile?: string;
  email?: string;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {
  active?: boolean;
}
