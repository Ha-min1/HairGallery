// Backward compatibility route: forwards all requests to the new bookings API route
import { GET as bookingsGET, POST as bookingsPOST } from '../bookings/route';

export const GET = bookingsGET;
export const POST = bookingsPOST;
export const runtime = 'edge';
