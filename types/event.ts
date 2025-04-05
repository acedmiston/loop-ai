export interface Guest {
  phone: string;
  name?: string;
  email?: string;
}

export interface Event {
  id: string;
  input: string;
  title: string;
  date: string;
  time: string;
  tone: string;
  message: string;
  createdAt: string;
  guests: Guest[];
}
