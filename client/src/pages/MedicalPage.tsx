import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { MedicalProfile as MedicalProfileType } from '../types';
import { 
  PencilSquareIcon, 
  CheckIcon, 
  UserCircleIcon, 
  PhoneIcon, 
  PaperClipIcon, 
  TrashIcon, 
  ShareIcon,
  DocumentIcon,
  XMarkIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const emptyProfile: MedicalProfileType = {
  fullName: '',
  dob: '',
  bloodType: '',
  allergies: '',
  conditions: '',
  medications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  files: [],
};

export const MedicalPage = () => {
  const [profile, setProfile] = useState<MedicalProfileType>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDuration, setShareDuration] = useState('24');
  const [generatedLink, setGeneratedLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.medical.getProfile()
      .then((data) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await api.medical.updateProfile(profile as unknown as Record<string, unknown>);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const result = await api.medical.uploadFile(file);
      if (result.file) {
        setProfile(prev => ({ ...prev, files: [...prev.files, result.file] }));
      }
    }
  };

  const deleteFile = async (fileId: string) => {
    await api.medical.deleteFile(fileId);
    setProfile(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
  };

  const generateShareLink = async () => {
    const result = await api.medical.generateShareLink(parseInt(shareDuration));
    if (result.link) {
      setGeneratedLink(`${window.location.origin}${result.link}`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto p-8 bg-white dark:bg-slate-800 rounded-xl">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 text-red-500 mr-2" />
          Medical Emergency ID
        </h2>
        <div className="flex space-x-3">
          {!isEditing && (
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 rounded-full font-medium flex items-center bg-blue-600 text-white hover:bg-blue-700"
            >
              <ShareIcon className="h-5 w-5 mr-2" /> Share
            </button>
          )}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-6 py-2 rounded-full font-medium flex items-center transition-all ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
            }`}
          >
            {isEditing ? <><CheckIcon className="h-5 w-5 mr-2" /> Save</> : <><PencilSquareIcon className="h-5 w-5 mr-2" /> Edit</>}
          </button>
        </div>
      </div>

      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-t-8 ${
        isEditing ? 'border-slate-300' : 'border-red-600'
      }`}>
        {!isEditing && (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/30 flex items-start space-x-4">
            <UserCircleIcon className="h-20 w-20 text-slate-400" />
            <div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{profile.fullName || 'Unknown'}</h3>
              <div className="mt-2 flex space-x-4">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                  Blood: {profile.bloodType || '--'}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700">
                  DOB: {profile.dob || '--'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Section title="Personal Information">
            <Input label="Full Name" name="fullName" value={profile.fullName} onChange={handleChange} isEditing={isEditing} />
            <Input label="Date of Birth" name="dob" type="date" value={profile.dob} onChange={handleChange} isEditing={isEditing} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Type</label>
              {isEditing ? (
                <select
                  name="bloodType"
                  value={profile.bloodType}
                  onChange={handleChange}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                >
                  <option value="">Select...</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              ) : (
                <div className="text-lg font-medium">{profile.bloodType || 'Not specified'}</div>
              )}
            </div>
          </Section>

          <Section title="Emergency Contact">
            <Input label="Contact Name" name="emergencyContactName" value={profile.emergencyContactName} onChange={handleChange} isEditing={isEditing} />
            <Input label="Phone Number" name="emergencyContactPhone" value={profile.emergencyContactPhone} onChange={handleChange} isEditing={isEditing} />
            {!isEditing && profile.emergencyContactPhone && (
              <a href={`tel:${profile.emergencyContactPhone}`} className="mt-2 inline-flex items-center text-green-600 font-bold">
                <PhoneIcon className="h-5 w-5 mr-1" /> Call Now
              </a>
            )}
          </Section>

          <Section title="Critical Medical Info" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextArea label="Allergies" name="allergies" value={profile.allergies} onChange={handleChange} isEditing={isEditing} important />
              <TextArea label="Conditions" name="conditions" value={profile.conditions} onChange={handleChange} isEditing={isEditing} />
              <TextArea label="Medications" name="medications" value={profile.medications} onChange={handleChange} isEditing={isEditing} />
            </div>
          </Section>

          <Section title="Medical Documents" className="md:col-span-2">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload prescriptions, x-rays, or insurance cards
                </p>
                {isEditing && (
                  <div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center text-sm">
                      <PaperClipIcon className="h-4 w-4 mr-1" /> Upload
                    </button>
                  </div>
                )}
              </div>
              {profile.files.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                  <DocumentIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-400 text-sm">No documents</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <DocumentIcon className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-slate-500">{file.uploadDate} • {file.size}</p>
                        </div>
                      </div>
                      {isEditing && (
                        <button onClick={() => deleteFile(file.id)} className="text-slate-400 hover:text-red-500">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Secure Share</h3>
              <button onClick={() => setShowShareModal(false)}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            {!generatedLink ? (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg mb-4">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start">
                    <ShieldExclamationIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    Share this link with emergency responders
                  </p>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Access Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '12', '24'].map(dur => (
                      <button key={dur} onClick={() => setShareDuration(dur)}
                        className={`py-2 rounded-lg border ${shareDuration === dur ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}>
                        {dur}h
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generateShareLink} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
                  Generate Link
                </button>
              </>
            ) : (
              <>
                <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg break-all font-mono text-sm mb-4">
                  {generatedLink}
                </div>
                <button onClick={() => { setGeneratedLink(''); setShowShareModal(false); }} className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    <h4 className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h4>
    {children}
  </div>
);

const Input = ({ label, name, value, onChange, isEditing, type = 'text' }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">{label}</label>
    {isEditing ? (
      <input type={type} name={name} value={value} onChange={onChange}
        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
    ) : (
      <div className="text-lg">{value || 'Not specified'}</div>
    )}
  </div>
);

const TextArea = ({ label, name, value, onChange, isEditing, important }: any) => (
  <div className={`mb-4 ${!isEditing && important && value ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg' : ''}`}>
    <label className={`block text-sm font-medium mb-1 ${!isEditing && important ? 'text-red-800 dark:text-red-300' : ''}`}>{label}</label>
    {isEditing ? (
      <textarea name={name} value={value} onChange={onChange} rows={3}
        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
    ) : (
      <div className={`whitespace-pre-wrap ${important ? 'font-bold text-red-700 dark:text-red-400' : ''}`}>{value || 'None'}</div>
    )}
  </div>
);
