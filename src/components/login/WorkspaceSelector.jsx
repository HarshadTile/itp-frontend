import { BuildingIcon, CaretIcon } from './icons.jsx';

/* The two supported scopes — value + a secondary description shown as a caption.
   Values and behaviour are unchanged from the original implementation. */
const SCOPES = {
  all: { label: 'All Channels — HQ / Admin', note: 'Head-office access to every processing channel.' },
  internalTeam: { label: 'Internal Team — Msetu/SRM · PO Portal · MFOX', note: 'Scoped to the three internal-team channels.' },
};

/** Portal / Team picker (native select for reliability + a11y). Controlled. */
export default function WorkspaceSelector({ id = 'lgn-portal', value, onChange }) {
  return (
    <div className="lgn-field">
      <label htmlFor={id}>Portal / Team</label>
      <div className="lgn-input">
        <BuildingIcon className="lgn-ic" />
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="all">{SCOPES.all.label}</option>
          <option value="internalTeam">{SCOPES.internalTeam.label}</option>
        </select>
        <CaretIcon className="lgn-caret" />
      </div>
      <span className="lgn-field-note">{(SCOPES[value] || SCOPES.all).note}</span>
    </div>
  );
}
