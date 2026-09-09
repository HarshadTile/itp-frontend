import { BuildingIcon, CaretIcon } from './icons.jsx';

/* The two supported scopes. Values and behaviour are unchanged from the
   original implementation; only the option copy is tidied. */
const OPTIONS = [
  { value: 'all', label: 'All Channels — HQ / Admin' },
  { value: 'internalTeam', label: 'Internal Team — Msetu/SRM · PO Portal · MFOX' },
];

/** Portal / Team picker (native select for reliability + a11y). Controlled. */
export default function WorkspaceSelector({ id = 'lgn-portal', value, onChange }) {
  return (
    <div className="lgn-field">
      <label htmlFor={id}>Portal / Team</label>
      <div className="lgn-input">
        <BuildingIcon className="lgn-ic" />
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <CaretIcon className="lgn-caret" />
      </div>
    </div>
  );
}
