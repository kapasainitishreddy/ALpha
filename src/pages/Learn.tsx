import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRICULUM, getLessonChoiceOrder } from '@/data/curriculum'
import { LESSON_EXAMPLES } from '@/data/lessonExamples'
import { LESSON_WRONG_FEEDBACK } from '@/data/lessonFeedback'
import { useStore } from '@/store/useStore'
import { useTranslation } from '@/lib/i18n'
import { Banner, Section } from '@/components/common'
import { SpeakButton } from '@/components/SpeakButton'
export default function Learn() {
  const { t, language } = useTranslation()
  const { completedLessons, completeLesson } = useStore()
  const [active, setActive] = useState(CURRICULUM[0].id)
  const [answer, setAnswer] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const lesson = CURRICULUM.find((l) => l.id === active)!
  // Rotate choices by lesson while retaining their canonical answer indexes.
  const choices = getLessonChoiceOrder(CURRICULUM.indexOf(lesson), lesson.answers[language].length)
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('learn')}</h1>
      <Banner>{t('paperNotice')}</Banner>
      <div className="text-sm text-muted">
        {completedLessons.filter((id) => CURRICULUM.some((l) => l.id === id)).length} /{' '}
        {CURRICULUM.length}
      </div>
      <label className="block">
        <span className="label">{t('learn')}</span>
        <select
          className="input"
          value={active}
          onChange={(e) => {
            setActive(e.target.value)
            setAnswer(null)
            setChecked(false)
          }}
        >
          {CURRICULUM.map((l, i) => (
            <option value={l.id} key={l.id}>
              {completedLessons.includes(l.id) ? '✓ ' : ''}
              {i + 1}. {l.title[language]}
            </option>
          ))}
        </select>
      </label>
      <Section title={lesson.title[language]}>
        <div className="card space-y-4">
          <p className="text-sm leading-relaxed">{lesson.body[language]}</p>
          <div className="rounded-lg border border-edge bg-panel2 p-3">
            <p className="label">
              {language === 'te'
                ? 'కల్పిత ఉదాహరణ'
                : language === 'hi'
                  ? 'काल्पनिक उदाहरण'
                  : 'Worked synthetic example'}
            </p>
            <p className="text-sm leading-relaxed mt-1">{LESSON_EXAMPLES[lesson.id][language]}</p>
          </div>
          <SpeakButton text={lesson.body[language]} />
          <Link className="btn-primary block text-center" to={lesson.route}>
            {t('practice')}
          </Link>
        </div>
      </Section>
      <Section title={t('quiz')}>
        <fieldset className="space-y-3">
          <legend className="text-sm mb-3">{lesson.question[language]}</legend>
          {choices.map((i) => (
            <label key={i} className="card flex gap-3 items-center">
              <input
                type="radio"
                name="answer"
                checked={answer === i}
                onChange={() => {
                  setAnswer(i)
                  setChecked(false)
                }}
              />
              {lesson.answers[language][i]}
            </label>
          ))}
        </fieldset>
        <button
          className="btn-ghost w-full"
          disabled={answer === null}
          onClick={() => {
            setChecked(true)
            if (answer === lesson.correct) completeLesson(lesson.id)
          }}
        >
          {t('check')}
        </button>
        {checked && (
          <div role="status" className="space-y-2">
            <p className={answer === lesson.correct ? 'text-up' : 'text-warn'}>
              {t(answer === lesson.correct ? 'correct' : 'retry')}
            </p>
            {answer !== lesson.correct && (
              <p className="text-xs text-muted">
                {LESSON_WRONG_FEEDBACK[lesson.id]?.[language]?.[answer ?? -1] ?? LESSON_EXAMPLES[lesson.id][language]}
              </p>
            )}
          </div>
        )}
      </Section>
      <a
        className="text-accent text-sm underline"
        href={lesson.source}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('sources')} ↗
      </a>
      {lesson.relatedSources?.map((source) => (
        <a key={source.url} className="ml-3 text-accent text-sm underline" href={source.url} target="_blank" rel="noopener noreferrer">
          {source.label} ↗
        </a>
      ))}
    </div>
  )
}
