import type { Episode } from '../../content/types';
const t = (en: string, ko = en) => ({ en, ko });
export const MINI_CASE: Episode = {
  id: 'mini', title: t('Mini'), series: t('Test'), brief: t('A wrench is missing.'), startPlaceId: 'hall', watsonStartPlaceId: 'hall',
  budgetMinutes: 120, clockLabel: (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
  places: [
    { id: 'hall', name: t('Hall'), description: t('A hall.'), adjacent: ['engine', 'galley'] },
    { id: 'engine', name: t('Engine'), description: t('Loud.'), adjacent: ['hall'] },
    { id: 'galley', name: t('Galley'), description: t('Warm.'), adjacent: ['hall'] },
  ],
  people: [
    { id: 'ada', name: t('Ada'), role: t('Engineer'), portrait: '🔧', truthful: false },
    { id: 'bo', name: t('Bo'), role: t('Cook'), portrait: '🍳', truthful: true },
  ],
  presence: [
    { personId: 'ada', placeId: 'engine', from: 0, to: 60 }, { personId: 'ada', placeId: 'galley', from: 60, to: 999 },
    { personId: 'bo', placeId: 'galley', from: 0, to: 999 },
  ],
  topics: [ { id: 'wrench', label: t('The wrench'), keywords: ['wrench', 'tool'] }, { id: 'night', label: t('Last night'), keywords: ['night', 'yesterday', 'where'] } ],
  statements: [
    { id: 's_ada_wrench', personId: 'ada', topicId: 'wrench', text: t('Never touched it.'), lie: true, refutedBy: ['e_print'] },
    { id: 's_ada_night', personId: 'ada', topicId: 'night', text: t('I was in the engine room all night.'), lie: true, asserts: [{ personId: 'ada', placeId: 'engine', from: 0, to: 120 }] },
    { id: 's_bo_night', personId: 'bo', topicId: 'night', text: t('Ada came to the galley after the first hour.'), lie: false, asserts: [{ personId: 'ada', placeId: 'galley', from: 60, to: 120 }] },
    { id: 's_bo_wrench', personId: 'bo', topicId: 'wrench', text: t('It hung by the stove.'), lie: false, availableFrom: 30 },
  ],
  evidence: [
    { id: 'e_hook', placeId: 'galley', name: t('Empty hook'), description: t('A hook by the stove. Empty.') },
    { id: 'e_print', placeId: 'galley', name: t('Grease print'), description: t('A greasy handprint.'), requiresCard: 's_bo_wrench', fullDescription: t('A greasy handprint — engine grease, on the hook.') },
    { id: 'e_log', placeId: 'engine', name: t('Door log'), description: t('Door log, partly wiped.'), availableTo: 90, asserts: [{ personId: 'ada', placeId: 'engine', from: 0, to: 55 }] },
  ],
  records: [ { id: 'r_manifest', title: t('Manifest'), body: t('One wrench, galley, checked out by Ada.'), keywords: ['wrench', 'manifest', 'ada'] } ],
  propositions: [
    { id: 'p_ada_left', text: t('Ada left the engine room before the second hour.'), provedBy: [['s_bo_night'], ['e_log']], refutedBy: [] },
    { id: 'p_ada_took', text: t('Ada took the wrench.'), provedBy: [['e_print', 's_bo_wrench']], refutedBy: ['s_ada_wrench'] },
    { id: 'p_bo_took', text: t('Bo took the wrench.'), provedBy: [], refutedBy: ['r_manifest'] },
  ],
  methods: [ { id: 'm_took', label: t('Took it from the hook') }, { id: 'm_sold', label: t('Sold it') } ],
  truth: { culpritId: 'ada', methodId: 'm_took', decisiveEvidenceId: 'e_print', motive: t('Debt.'), reveal: t('Ada took it.'), hook: t('The manifest was signed by someone else.') },
};
