export type TransferRouteData = {
  id: string;
  from: string;
  to: string;
  price: number;
  notes: string;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export type PrivateServiceData = {
  id: string;
  name: string;
  kind: "OUTING" | "PRIVATE_VISIT" | "CHAUFFEUR";
  description: string;
  price: number;
  currency: string;
  passengerLimit: number;
  duration: string;
  startTimes: string[];
  image: string;
  imageAlt: string;
  isActive: boolean;
  sortOrder: number;
};

export type ReservedPrivateSlot = {
  privateServiceId: string;
  serviceDate: string;
  serviceTime: string;
};

export type TransferLocationData = {
  id: string;
  name: string;
  isActive: boolean;
  isDeparture: boolean;
  isArrival: boolean;
  sortOrder: number;
};

export type TransferRequestData = {
  id: string;
  serviceType: "AIRPORT_ROUTE" | "PRIVATE_SERVICE" | "CUSTOM_ROUTE";
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  serviceName: string;
  departure: string;
  arrival: string;
  priceAtRequest: number | null;
  currency: string;
  serviceDate: string;
  serviceTime: string | null;
  passengerCount: number;
  luggageCount: number;
  hotelAddress: string | null;
  flightNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  createdAt: string;
};

export type TransferDashboardData = {
  routes: TransferRouteData[];
  services: PrivateServiceData[];
  locations: TransferLocationData[];
  requests: TransferRequestData[];
};

export type TransferDashboardUser = {
  username: string;
  role: "ADMIN" | "STAFF";
};

export type TransferRequestInput = {
  serviceType: "AIRPORT_ROUTE" | "PRIVATE_SERVICE" | "CUSTOM_ROUTE";
  routeId?: string;
  privateServiceId?: string;
  departure?: string;
  arrival?: string;
  serviceDate: string;
  serviceTime?: string;
  passengerCount: number;
  luggageCount: number;
  hotelAddress?: string;
  flightNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
};

export type RouteInput = {
  id?: string;
  from: string;
  to: string;
  price: number;
  notes: string;
  isActive: boolean;
};

export type PrivateServiceInput = {
  id?: string;
  name: string;
  kind: "OUTING" | "PRIVATE_VISIT" | "CHAUFFEUR";
  description: string;
  price: number;
  passengerLimit: number;
  duration: string;
  startTimes: string[];
  image: string;
  imageAlt: string;
  isActive: boolean;
};
