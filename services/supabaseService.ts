
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdzfeaxytjzltdbdtrnj.supabase.co';
const supabaseKey = 'sb_publishable_VOeKQWH4nbkVcX6OylKDXw_T915wXnZ';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetches all doctors.
 */
export async function getDoctors() {
  try {
    const { data, error } = await supabase.from('doctors').select('*');
    
    if (error) {
      console.error("Supabase Error (getDoctors):", error);
      return { error: `Database error: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { info: "No doctors available in database." };
    }

    return data;
  } catch (err: any) {
    return { error: `Unexpected error: ${err.message}` };
  }
}

/**
 * Inserts patient details and returns full booking info for confirmation.
 */
export async function bookAppointment(
  doctorId: string, 
  patientName: string, 
  patientAge: number, 
  reason: string, 
  address: string, 
  zipcode: string
) {
  try {
    let finalDoctorId = doctorId;
    let doctorName = "Unknown Doctor";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Find doctor info
    if (!uuidRegex.test(doctorId)) {
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('id, name')
        .ilike('name', `%${doctorId}%`)
        .limit(1);

      if (docError) throw new Error(`Doctor lookup failed: ${docError.message}`);
      
      if (docData && docData.length > 0) {
        finalDoctorId = docData[0].id;
        doctorName = docData[0].name;
      } else {
        return { error: `Could not find doctor "${doctorId}".` };
      }
    } else {
      const { data: docData } = await supabase.from('doctors').select('name').eq('id', doctorId).single();
      if (docData) doctorName = docData.name;
    }

    const bookingPayload = { 
      doctor_id: finalDoctorId, 
      patient_name: patientName, 
      patient_age: Number(patientAge),
      reason_for_appointment: reason,
      street_address: address,
      zipcode: zipcode
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([bookingPayload])
      .select();
    
    if (error) {
      return { error: `Booking Failed: ${error.message}` };
    }

    return { 
      success: true, 
      bookingDetails: {
        ...bookingPayload,
        doctorName,
        id: data[0].id,
        createdAt: data[0].created_at
      }
    };
  } catch (err: any) {
    return { error: `System Exception: ${err.message}` };
  }
}
