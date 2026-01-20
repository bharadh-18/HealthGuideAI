
import React from 'react';
import { motion } from 'framer-motion';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="bg-blue-600 p-8 text-center text-white relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold">Appointment Confirmed</h2>
          <p className="text-blue-100 mt-1 uppercase text-xs tracking-widest font-bold">Ref ID: {details.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div className="p-8 space-y-6 transition-colors">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">Patient</p>
              <p className="text-slate-900 dark:text-slate-100 font-semibold">{details.patient_name} ({details.patient_age}y)</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">Doctor</p>
              <p className="text-slate-900 dark:text-slate-100 font-semibold">{details.doctorName}</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="border-t border-slate-100 dark:border-slate-800 pt-4"
          >
            <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">Reason for Visit</p>
            <p className="text-slate-700 dark:text-slate-300 mt-1">{details.reason_for_appointment}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="border-t border-slate-100 dark:border-slate-800 pt-4"
          >
            <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">Location</p>
            <p className="text-slate-700 dark:text-slate-300 mt-1">{details.street_address}, {details.zipcode}</p>
          </motion.div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
            >
              Done
            </motion.button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
              A copy of this confirmation has been saved to our secure records.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
