import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react'
import { loadState, saveState } from './storage.js'

type Deck = {
  id: string
  name: string
  createdAt: number
}

type Card = {
  id: string
  front: string
  back: string
  updatedAt: number
}

type AppState = {
  decks: Deck[]
  cardsByDeckId: Record<string, Card[]>
  activeDeckId: string | null
  ui: {
    isModalOpen: boolean
    activeCardIndex: number
    theme?: 'light' | 'dark'
  }
}

const now = Date.now()

const defaultState: AppState = {
  decks: [
    { id: 'getting-started', name: 'Getting Started', createdAt: now },
    { id: 'javascript-basics', name: 'JavaScript Basics', createdAt: now },
    { id: 'typescript', name: 'TypeScript', createdAt: now },
  ],
  cardsByDeckId: {
    'getting-started': [{
      id: 'card-1',
      front: 'What is a flashcard?',
      back: 'A study prompt with a question on one side and its answer on the other.',
      updatedAt: now,
    }],
    'javascript-basics': [],
    typescript: [],
  },
  activeDeckId: 'getting-started',
  ui: { isModalOpen: false, activeCardIndex: 0, theme: 'light' },
}

function getInitialState(): AppState {
  const state = loadState(defaultState)
  if (
    !Array.isArray(state.decks)
    || state.cardsByDeckId === null
    || typeof state.cardsByDeckId !== 'object'
    || state.ui === null
    || typeof state.ui !== 'object'
  ) {
    return defaultState
  }

  if (!state.ui.theme) {
    state.ui.theme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return state
}

type ModalMode = 'create' | 'rename' | null
type CardModalMode = 'create' | 'edit' | null

type ModalProps = {
  title: string
  initialName: string
  submitLabel: string
  onClose: () => void
  onSubmit: (name: string) => void
}

function Modal({ title, initialName, submitLabel, onClose, onSubmit }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    inputRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [onClose])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = inputRef.current?.value.trim() ?? ''
    if (name) onSubmit(name)
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="modal-label" htmlFor="deck-name">Deck name</label>
          <input
            ref={inputRef}
            id="deck-name"
            name="deck-name"
            type="text"
            defaultValue={initialName}
            placeholder="e.g. React Basics"
            required
          />
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

type CardModalProps = {
  card?: Card
  onClose: () => void
  onSubmit: (front: string, back: string) => void
}

function CardModal({ card, onClose, onSubmit }: CardModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    frontInputRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [onClose])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const front = String(formData.get('front') ?? '').trim()
    const back = String(formData.get('back') ?? '').trim()
    if (front && back) onSubmit(front, back)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title">
        <div className="modal-header">
          <h2 id="card-modal-title">{card ? 'Edit card' : 'Create a new card'}</h2>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="modal-label" htmlFor="card-front">Front</label>
          <input ref={frontInputRef} id="card-front" name="front" type="text" defaultValue={card?.front} required />
          <label className="modal-label" htmlFor="card-back">Back</label>
          <textarea id="card-back" name="back" defaultValue={card?.back} required />
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit">{card ? 'Save card' : 'Create card'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const titleId = useId()

  return (
    <section className="empty-state" role="status" aria-labelledby={titleId}>
      <svg className="empty-state-icon" aria-hidden="true" viewBox="0 0 48 48" focusable="false">
        <path d="M8 12.5A4.5 4.5 0 0 1 12.5 8h23a4.5 4.5 0 0 1 4.5 4.5v23a4.5 4.5 0 0 1-4.5 4.5h-23A4.5 4.5 0 0 1 8 35.5v-23Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="m16 17 16 14M32 17 16 31" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="button button-primary" type="button" onClick={onAction}>{actionLabel}</button>
      )}
    </section>
  )
}

export default function App() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [appState, setAppState] = useState<AppState>(getInitialState)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [cardModalMode, setCardModalMode] = useState<CardModalMode>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null)

  const { decks, cardsByDeckId, activeDeckId, ui } = appState
  const activeDeck = decks.find((deck) => deck.id === activeDeckId) ?? null
  const editingDeck = decks.find((deck) => deck.id === editingDeckId)
  const deckCards = activeDeckId ? (cardsByDeckId[activeDeckId] ?? []) : []
  const filteredCards = deckCards.filter((card) => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    return !query || `${card.front} ${card.back}`.toLowerCase().includes(query)
  })
  const activeCard = filteredCards[ui.activeCardIndex] ?? filteredCards[0]
  const studyCards = studyDeckId ? (cardsByDeckId[studyDeckId] ?? []).filter((card) => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    return !query || `${card.front} ${card.back}`.toLowerCase().includes(query)
  }) : []
  const displayedCard = isStudyMode ? studyCards[ui.activeCardIndex] : activeCard

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', ui.theme ?? 'light')
  }, [ui.theme])

  const toggleTheme = () => {
    setAppState((current) => ({
      ...current,
      ui: { ...current.ui, theme: current.ui.theme === 'dark' ? 'light' : 'dark' }
    }))
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setAppState((current) => ({ ...current, ui: { ...current.ui, activeCardIndex: 0 } }))
      setIsFlipped(false)
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    saveState(appState)
  }, [appState])

  const openCreateModal = () => {
    setEditingDeckId(null)
    setModalMode('create')
    setAppState((current) => ({ ...current, ui: { ...current.ui, isModalOpen: true } }))
  }

  const openRenameModal = (deckId: string) => {
    setEditingDeckId(deckId)
    setModalMode('rename')
    setAppState((current) => ({ ...current, ui: { ...current.ui, isModalOpen: true } }))
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingDeckId(null)
    setAppState((current) => ({ ...current, ui: { ...current.ui, isModalOpen: false } }))
  }

  const saveDeck = (name: string) => {
    if (modalMode === 'rename' && editingDeckId) {
      setAppState((current) => ({
        ...current,
        decks: current.decks.map((deck) => deck.id === editingDeckId ? { ...deck, name } : deck),
      }))
    } else if (modalMode === 'create') {
      const newDeck = { id: `deck-${Date.now()}`, name, createdAt: Date.now() }
      setAppState((current) => ({
        ...current,
        decks: [...current.decks, newDeck],
        cardsByDeckId: { ...current.cardsByDeckId, [newDeck.id]: [] },
        activeDeckId: newDeck.id,
        ui: { ...current.ui, activeCardIndex: 0 },
      }))
    }
    closeModal()
  }

  const deleteDeck = (deckId: string) => {
    setAppState((current) => {
      const decksWithoutDeleted = current.decks.filter((deck) => deck.id !== deckId)
      const nextDeckId = deckId === current.activeDeckId ? decksWithoutDeleted[0]?.id ?? null : current.activeDeckId
      const cardsByDeckId = Object.fromEntries(
        Object.entries(current.cardsByDeckId).filter(([id]) => id !== deckId),
      )
      return {
        ...current,
        decks: decksWithoutDeleted,
        cardsByDeckId,
        activeDeckId: nextDeckId,
        ui: { ...current.ui, activeCardIndex: 0 },
      }
    })
  }

  const enterStudyMode = (deckId: string) => {
    setAppState((current) => ({
      ...current,
      activeDeckId: deckId,
      ui: { ...current.ui, activeCardIndex: 0 },
    }))
    setStudyDeckId(deckId)
    setIsFlipped(false)
    setIsStudyMode(true)
  }

  const exitStudyMode = () => {
    setIsStudyMode(false)
    setStudyDeckId(null)
    setAppState((current) => ({ ...current, ui: { ...current.ui, activeCardIndex: 0 } }))
    setIsFlipped(false)
  }

  useEffect(() => {
    if (!isStudyMode) return

    const handleStudyKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[role="dialog"], button, input, textarea, select, [contenteditable="true"]')) return

      if (event.key === 'Escape') {
        event.preventDefault()
        exitStudyMode()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setAppState((current) => ({ ...current, ui: { ...current.ui, activeCardIndex: studyCards.length ? (current.ui.activeCardIndex + 1) % studyCards.length : 0 } }))
        setIsFlipped(false)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setAppState((current) => ({ ...current, ui: { ...current.ui, activeCardIndex: studyCards.length ? (current.ui.activeCardIndex - 1 + studyCards.length) % studyCards.length : 0 } }))
        setIsFlipped(false)
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setIsFlipped((flipped) => !flipped)
      }
    }

    document.addEventListener('keydown', handleStudyKeyDown)
    return () => document.removeEventListener('keydown', handleStudyKeyDown)
  }, [isStudyMode, studyCards.length])

  const openCardModal = (mode: CardModalMode, cardId: string | null = null) => {
    setEditingCardId(cardId)
    setCardModalMode(mode)
    setAppState((current) => ({ ...current, ui: { ...current.ui, isModalOpen: true } }))
  }

  const closeCardModal = () => {
    setCardModalMode(null)
    setEditingCardId(null)
    setAppState((current) => ({ ...current, ui: { ...current.ui, isModalOpen: false } }))
  }

  const saveCard = (front: string, back: string) => {
    if (cardModalMode === 'edit' && editingCardId) {
      setAppState((current) => ({
        ...current,
        cardsByDeckId: Object.fromEntries(Object.entries(current.cardsByDeckId).map(([deckId, deckCards]) => [
          deckId,
          deckCards.map((card) => card.id === editingCardId ? { ...card, front, back, updatedAt: Date.now() } : card),
        ])),
      }))
    } else if (cardModalMode === 'create') {
      const newCard = { id: `card-${Date.now()}`, front, back, updatedAt: Date.now() }
      setAppState((current) => ({
        ...current,
        cardsByDeckId: {
          ...current.cardsByDeckId,
          [activeDeckId ?? '']: [...(current.cardsByDeckId[activeDeckId ?? ''] ?? []), newCard],
        },
        ui: { ...current.ui, activeCardIndex: (current.cardsByDeckId[activeDeckId ?? ''] ?? []).length },
      }))
    }
    closeCardModal()
  }

  const handleShuffle = () => {
    const deckId = isStudyMode ? studyDeckId : activeDeckId
    if (!deckId) return

    setAppState((current) => {
      const cards = [...(current.cardsByDeckId[deckId] ?? [])]
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = cards[i]
        if (temp !== undefined && cards[j] !== undefined) {
          cards[i] = cards[j]!
          cards[j] = temp
        }
      }
      return {
        ...current,
        cardsByDeckId: { ...current.cardsByDeckId, [deckId]: cards },
        ui: { ...current.ui, activeCardIndex: 0 },
      }
    })
    setIsFlipped(false)
  }

  const handlePrevCard = () => {
    const listLength = isStudyMode ? studyCards.length : filteredCards.length
    if (!listLength) return
    setAppState((current) => ({
      ...current,
      ui: { ...current.ui, activeCardIndex: (current.ui.activeCardIndex - 1 + listLength) % listLength },
    }))
    setIsFlipped(false)
  }

  const handleNextCard = () => {
    const listLength = isStudyMode ? studyCards.length : filteredCards.length
    if (!listLength) return
    setAppState((current) => ({
      ...current,
      ui: { ...current.ui, activeCardIndex: (current.ui.activeCardIndex + 1) % listLength },
    }))
    setIsFlipped(false)
  }

  const handleCardAction = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    const actionElement = target.closest<HTMLElement>('[data-card-action]')
    if (!actionElement) return

    const action = actionElement.dataset.cardAction
    const cardId = actionElement.dataset.cardId ?? null

    if (action === 'create') openCardModal('create')
    if (action === 'select' && cardId) {
      const selectedIndex = filteredCards.findIndex((card) => card.id === cardId)
      if (selectedIndex >= 0) setAppState((current) => ({ ...current, ui: { ...current.ui, activeCardIndex: selectedIndex } }))
    }
    if (action === 'edit' && cardId) openCardModal('edit', cardId)
    if (action === 'delete' && cardId) {
      setAppState((current) => ({
        ...current,
        cardsByDeckId: {
          ...current.cardsByDeckId,
          [activeDeckId ?? '']: (current.cardsByDeckId[activeDeckId ?? ''] ?? []).filter((card) => card.id !== cardId),
        },
        ui: { ...current.ui, activeCardIndex: 0 },
      }))
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Flashcards</h1>
          <p>Study smarter, one card at a time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="button button-secondary" type="button" aria-label="Toggle theme" onClick={toggleTheme} style={{ padding: '0.625rem' }}>
            {ui.theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button className="button button-primary" type="button" aria-label="Create a new deck" onClick={openCreateModal}>
            + New Deck
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="deck-sidebar">
          <h2>Decks</h2>
          <nav aria-label="Flashcard decks">
            {decks.length > 0 ? <ul>
              {decks.map((deck) => (
                <li className="deck-item" key={deck.id}>
                  <button
                    className={`deck-button ${deck.id === activeDeckId ? 'is-active' : ''}`}
                    type="button"
                    aria-label={`Select ${deck.name} deck`}
                    aria-pressed={deck.id === activeDeckId}
                    aria-current={deck.id === activeDeckId ? 'page' : undefined}
                    onClick={() => setAppState((current) => ({
                      ...current,
                      activeDeckId: deck.id,
                      ui: { ...current.ui, activeCardIndex: 0 },
                    }))}
                  >
                    {deck.name}
                  </button>
                  <div className="deck-actions">
                    <button type="button" aria-label={`Study ${deck.name} deck`} onClick={() => enterStudyMode(deck.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button type="button" aria-label={`Rename ${deck.name} deck`} onClick={() => openRenameModal(deck.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                      </svg>
                    </button>
                    <button type="button" aria-label={`Delete ${deck.name} deck`} onClick={() => deleteDeck(deck.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul> : (
              <EmptyState
                title="No decks yet"
                description="Create a deck to organize your flashcards."
                actionLabel="Create deck"
                onAction={openCreateModal}
              />
            )}
          </nav>
        </aside>

        <main className="card-main">
          <section aria-labelledby="current-deck-heading" className="card-content" onClick={handleCardAction}>
            {!activeDeck ? (
              <EmptyState
                title="Choose or create a deck"
                description="Your decks will appear here when you add one."
                actionLabel="Create deck"
                onAction={openCreateModal}
              />
            ) : <>
              <div className="card-heading">
                <div>
                  <h2 id="current-deck-heading">{activeDeck?.name ?? 'No deck selected'}</h2>
                  <p aria-live="polite">{isStudyMode ? `Study mode · Card ${ui.activeCardIndex + 1} of ${studyCards.length}` : `${filteredCards.length} match${filteredCards.length === 1 ? '' : 'es'}`}</p>
                </div>
                {isStudyMode && <button className="button button-secondary" type="button" onClick={exitStudyMode}>Exit study mode</button>}
                <div className="toolbar" role="toolbar" aria-label="Deck tools">
                  <label className="search-field" htmlFor="card-search">
                    <span className="sr-only">Search cards</span>
                    <input id="card-search" name="card-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search cards..." aria-label="Search cards" />
                  </label>
                  <button className="button button-secondary" type="button" aria-label="Shuffle cards" onClick={handleShuffle}>Shuffle</button>
                  <button className="button button-primary" type="button" data-card-action="create" aria-label="Create a new card">+ New Card</button>
                </div>
              </div>

              {deckCards.length === 0 ? (
                <EmptyState
                  title="No cards in this deck"
                  description="Add your first card to start studying."
                  actionLabel="Create card"
                  onAction={() => openCardModal('create')}
                />
              ) : filteredCards.length === 0 ? (
                <EmptyState
                  title="No matching cards"
                  description="Try a different search term or clear the search."
                  actionLabel="Clear search"
                  onAction={() => setSearchQuery('')}
                />
              ) : <div className="card-list">
                {filteredCards.map((card) => (
                  <button
                    className={`card-list-item ${card.id === activeCard?.id ? 'is-selected' : ''}`}
                    type="button"
                    data-card-action="select"
                    data-card-id={card.id}
                    aria-pressed={card.id === activeCard?.id}
                    key={card.id}
                  >
                    {card.front}
                  </button>
                ))}
              </div>}

              {filteredCards.length > 0 && <article className={`card ${isFlipped ? 'is-flipped' : ''}`} aria-live="polite">
                <div className="card-inner">
                  <div className="card-face card-front" aria-hidden={isFlipped}>
                    <span className="card-label">Front</span>
                    <h3>{displayedCard?.front ?? 'No cards in this deck'}</h3>
                  </div>
                  <div className="card-face card-back" aria-hidden={!isFlipped}>
                    <span className="card-label">Back</span>
                    <p>{displayedCard?.back ?? 'Create a card to get started.'}</p>
                  </div>
                </div>
              </article>}

              {activeCard && filteredCards.length > 0 && (
                <div className="card-record-actions">
                  <button className="button button-secondary" type="button" aria-label="Edit card" data-card-action="edit" data-card-id={activeCard.id}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                    </svg>
                  </button>
                  <button className="button button-secondary" type="button" aria-label="Delete card" data-card-action="delete" data-card-id={activeCard.id}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {filteredCards.length > 0 && <div className="card-actions">
                <button className="button button-secondary" type="button" aria-label="Show previous card" onClick={handlePrevCard}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                    <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414L9.414 12l6.293 6.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  aria-label={isFlipped ? 'Show front of card' : 'Show back of card'}
                  aria-pressed={isFlipped}
                  onClick={() => setIsFlipped((flipped) => !flipped)}
                >
                  {isFlipped ? 'Show Front' : 'Flip Card'}
                </button>
                <button className="button button-primary" type="button" aria-label="Show next card" onClick={handleNextCard}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6" width="20" height="20">
                    <path fillRule="evenodd" d="M8.293 4.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414-1.414L14.586 12 8.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>}
            </>}
          </section>
        </main>
      </div>

      <footer className="app-footer">
        <p>Use the sidebar to choose a deck. Flip a card to reveal the answer.</p>
      </footer>

      {modalMode && (
        <Modal
          title={modalMode === 'create' ? 'Create a new deck' : 'Rename deck'}
          initialName={editingDeck?.name ?? ''}
          submitLabel={modalMode === 'create' ? 'Create deck' : 'Save name'}
          onClose={closeModal}
          onSubmit={saveDeck}
        />
      )}

      {cardModalMode && (
        <CardModal
          card={Object.values(cardsByDeckId).flat().find((card) => card.id === editingCardId)}
          onClose={closeCardModal}
          onSubmit={saveCard}
        />
      )}
    </div>
  )
}