export interface Guest {
  phone: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  id?: string;
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
  location?: string;
  location_lat?: number;
  location_lng?: number;
}
