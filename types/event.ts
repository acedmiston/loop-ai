export interface Guest {
  phone: string;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  id?: string;
  opted_out?: boolean;
}

export interface Event {
  id: string;
  input: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  tone: string;
  message: string;
  createdAt: string;
  guests: Guest[];
  location?: string;
  location_lat?: number;
  location_lng?: number;
}
