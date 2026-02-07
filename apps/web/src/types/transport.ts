export interface Vehicle {
  id: string
  tenant_id: string
  registration_number: string
  capacity: number
  type: string
  status: 'active' | 'maintenance' | 'retired'
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  tenant_id: string
  user_id?: string
  full_name: string
  license_number: string
  phone: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  tenant_id: string
  name: string
  vehicle_id: string
  driver_id: string
  description?: string
  vehicle_number?: string
  driver_name?: string
  created_at: string
  updated_at: string
}

export interface RouteStop {
  id: string
  route_id: string
  name: string
  sequence_order: number
  arrival_time?: string
  pickup_cost?: number
  drop_cost?: number
  created_at: string
  updated_at: string
}

export interface Allocation {
  id: string
  tenant_id: string
  student_id: string
  student_name: string
  route_id: string
  route_name: string
  stop_id?: string
  stop_name?: string
  start_date: string
  end_date?: string
  status: 'active' | 'cancelled'
  created_at: string
}
