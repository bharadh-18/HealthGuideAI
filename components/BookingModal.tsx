
import React from 'react';

interface BookingDetails {
  id: string;
  patient_name: string;
  patient_age: number;
  doctorName: string;
  reason_for_appointment: string;
  street_address: string;
  zipcode: string;
  createdAt: string;
}

interface BookingModalProps {
  details: BookingDetails | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ details, onClose }) => {
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Appointment Confirmed</h2>
          <p className="text-blue-100 mt-1">Ref ID: {details.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Patient</p>
              <p className="text-slate-900 font-semibold">{details.patient_name} ({details.patient_age}y)</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Doctor</p>
              <p className="text-slate-900 font-semibold">{details.doctorName}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Reason for Visit</p>
            <p className="text-slate-700 mt-1">{details.reason_for_appointment}</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Location</p>
            <p className="text-slate-700 mt-1">{details.street_address}, {details.zipcode}</p>
          </div>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Done
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              A copy of this confirmation has been saved to our secure records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
