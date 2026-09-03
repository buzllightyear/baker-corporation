import type { Episode } from '../../content/types';
import { MINI_CASE } from './mini-case';
const t = (en: string, ko = en) => ({ en, ko });
const IDS = ['night', 'wrench', 'stove', 'watch', 'manifest', 'debt', 'rumour'] as const;   // 7 — two past the fold
/** Mini case with one witness who has seven topics, so the talk rail has to fold. Authored order is the order above. */
export const MANY_TOPICS: Episode = {
  ...MINI_CASE, id: 'many',
  topics: IDS.map((id, i) => ({ id, label: t(`Topic ${i + 1} ${id}`), keywords: [id] })),
  statements: IDS.map((id) => ({ id: `s_bo_${id}`, personId: 'bo', topicId: id, text: t(`Bo on ${id}.`), lie: false })),
  propositions: [], tutorial: undefined,
};
