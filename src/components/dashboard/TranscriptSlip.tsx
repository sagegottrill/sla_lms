import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideoutUser } from "./UserProfileSlideout";

interface TranscriptSlipProps {
  user: SlideoutUser | null;
  onClose: () => void;
}

export default function TranscriptSlip({ user, onClose }: TranscriptSlipProps) {
  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 print:p-0 print:z-auto">
        {/* Backdrop (hidden when printing) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/90 backdrop-blur-sm print:hidden"
        />

        {/* Modal / Slip Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white text-black shadow-2xl rounded-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:rounded-none print:bg-transparent"
        >
          {/* Action Bar (hidden when printing) */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 print:hidden">
            <h2 className="font-semibold text-gray-700">Official Transcript View</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-white text-gray-700 border-gray-300"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" /> Print PDF
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* The Actual Printable Document */}
          <div className="p-8 sm:p-12 print:p-0 space-y-8 bg-white" id="printable-transcript">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
              <div>
                <h1 className="text-3xl font-serif text-gray-900 font-bold mb-1 tracking-tight">
                  She Leads Africa
                </h1>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                  Connecta LMS &mdash; Official Transcript
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Date Issued: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span></p>
                <p>Document ID: <span className="font-mono text-gray-900">TX-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span></p>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Learner Details</p>
                <p className="font-bold text-gray-900 text-lg uppercase">{user.name}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Status</p>
                <p className="font-bold text-gray-900 uppercase">Enrolled User</p>
                <p className="text-gray-600">Joined: {user.joined}</p>
              </div>
            </div>

            {/* Course History */}
            <div>
              <p className="text-gray-900 uppercase text-xs font-bold tracking-wider mb-3 border-b border-gray-200 pb-2">
                Course & Program History
              </p>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="py-2.5 px-3 font-semibold text-gray-700">Course / Program</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-700 w-24">Credits</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-700 w-32">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-700 w-32 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium text-gray-900">Women in Data Science Masterclass</td>
                    <td className="py-3 px-3 text-gray-600">3.0</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">100%</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium text-gray-900">Startup Founders Finance Basics</td>
                    <td className="py-3 px-3 text-gray-600">2.5</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">100%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium text-gray-900">Leadership Excellence Cohort 4</td>
                    <td className="py-3 px-3 text-gray-600">4.0</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-medium text-amber-600">In Progress</span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">{user.progress || 60}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Certifications Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 print:border-gray-900">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-3">
                <Award className="w-5 h-5 text-gray-700" />
                Certifications Awarded
              </div>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside">
                <li>SLA Data Science Foundation Certification (Issued Jan 2026)</li>
                <li>SLA Early Stage Finance Certificate (Issued Feb 2026)</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="pt-12 flex justify-between items-end border-t border-gray-200">
              <div className="space-y-1">
                <div className="w-48 h-px bg-gray-900 mt-8 mb-2"></div>
                <p className="text-xs font-bold text-gray-900 uppercase">Registrar Signature</p>
                <p className="text-[10px] text-gray-500">She Leads Africa Learning Programs</p>
              </div>
              <div className="text-[10px] text-gray-400 max-w-[200px] text-right">
                This document is a true and certified record of the learner's activity on the Connecta LMS platform.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
