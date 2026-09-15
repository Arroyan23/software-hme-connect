import { FormModal } from './ContentForm';
export default function DetailModal({ item,onClose }) {
  return <FormModal title={item.title} onClose={onClose}>
    {item.image && <img src={item.image} alt={item.title} className="w-full rounded-lg mb-4"/>}
    <p className="text-xs text-gray-500 mb-3">{[item.date,item.location,item.company].filter(Boolean).join(' / ')}</p>
    <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.body || item.desc || item.excerpt}</p>
    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-5 text-[#a67c00]">Buka tautan informasi</a>}
  </FormModal>;
}
