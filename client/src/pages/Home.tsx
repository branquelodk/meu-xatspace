import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowDown,
  AudioLines,
  Camera,
  Check,
  ChevronRight,
  Disc3,
  ExternalLink,
  Headphones,
  Heart,
  ImagePlus,
  Instagram,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Radio,
  RadioTower,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

type Photo = { src: string; caption: string };
type Profile = {
  name: string;
  location: string;
  pronouns: string;
  mood: string;
  about: string;
  anime: string;
  music: string;
  radioName: string;
  radioUrl: string;
  songName: string;
  songUrl: string;
  instagram: string;
  photos: Photo[];
};

const STORAGE_KEY = "meu-xatspace-profile-v1";
const HERO_IMAGE = "/manus-storage/xatspace-night-sky-male_acaddd14.png";
const DEFAULT_PROFILE: Profile = {
  name: "seu nome aqui",
  location: "em algum lugar do universo",
  pronouns: "pronomes",
  mood: "na minha própria frequência",
  about: "Gosto de anime, música boa e conversas que viram madrugada. Este cantinho ainda está esperando um pouco de você — toque em “Editar espaço” e deixe tudo com a sua cara. ✦",
  anime: "um favorito para preencher",
  music: "a trilha sonora da minha vida",
  radioName: "Minha rádio",
  radioUrl: "",
  songName: "Música favorita",
  songUrl: "",
  instagram: "",
  photos: [],
};

function readProfile(): Profile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function normalizeSocial(value: string) {
  if (!value.trim()) return "";
  return value.startsWith("http") ? value : `https://instagram.com/${value.replace(/^@/, "")}`;
}

function photoToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Este arquivo não parece ser uma imagem válida."));
      image.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Seu navegador não conseguiu preparar a foto."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(readProfile);
  const [draft, setDraft] = useState<Profile>(profile);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeAudio, setActiveAudio] = useState<"radio" | "song">("radio");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(72);
  const [audioMessage, setAudioMessage] = useState("");
  const [notice, setNotice] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const audioSource = activeAudio === "radio" ? profile.radioUrl : profile.songUrl;
  const audioTitle = activeAudio === "radio" ? profile.radioName : profile.songName;
  const audioKind = activeAudio === "radio" ? "AO VIVO / STREAM" : "FAIXA FAVORITA";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      setNotice("O navegador ficou sem espaço para guardar tudo. Remova algumas fotos e tente de novo.");
    }
  }, [profile]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioMessage("");
    }
  }, [audioSource]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const details = useMemo(
    () => [
      { label: "mora em", value: profile.location, icon: "⌂" },
      { label: "meu anime", value: profile.anime, icon: "✧" },
      { label: "meu som", value: profile.music, icon: "♫" },
    ],
    [profile.location, profile.anime, profile.music],
  );

  function openEditor() {
    setDraft({ ...profile, photos: [...profile.photos] });
    setEditorOpen(true);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfile(draft);
    setEditorOpen(false);
    setNotice("Seu espaço foi atualizado neste navegador. ✦");
  }

  async function toggleAudio() {
    const player = audioRef.current;
    if (!player || !audioSource) {
      setAudioMessage("Adicione o link direto da sua música ou rádio em “Editar espaço”.");
      return;
    }
    if (player.paused) {
      try {
        await player.play();
        setAudioMessage("");
      } catch {
        setIsPlaying(false);
        setAudioMessage("Não consegui abrir esse link. Use um stream de áudio direto (MP3, AAC ou OGG).");
      }
    } else {
      player.pause();
    }
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const remaining = Math.max(0, 6 - profile.photos.length);
    if (remaining === 0) {
      setNotice("A galeria aceita até 6 fotos. Remova uma para adicionar outra.");
      event.target.value = "";
      return;
    }
    try {
      const added = await Promise.all(files.slice(0, remaining).map(async (file) => ({
        src: await photoToDataUrl(file),
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      })));
      setProfile((current) => ({ ...current, photos: [...current.photos, ...added].slice(0, 6) }));
      setNotice(`${added.length} ${added.length === 1 ? "foto adicionada" : "fotos adicionadas"} à sua galeria. ✦`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível adicionar a foto.");
    }
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setProfile((current) => ({ ...current, photos: current.photos.filter((_, photoIndex) => photoIndex !== index) }));
    setNotice("Foto removida da sua galeria.");
  }

  return (
    <div className="space-page">
      <div className="page-grain" aria-hidden="true" />
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Voltar ao início"><span className="wordmark-spark">✦</span> orbit<span className="wordmark-dot">.</span></a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#sobre">sobre mim</a>
          <a href="#galeria">galeria</a>
          <a href="#vibes">minhas vibes</a>
        </nav>
        <div className="topbar-right">
          <span className="online-pill"><span className="online-dot" /> disponível</span>
          <button className="edit-button top-edit" onClick={openEditor}><Pencil size={14} /> editar espaço</button>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 9, 23, .92) 0%, rgba(12, 10, 28, .78) 38%, rgba(14, 10, 29, .13) 100%), linear-gradient(0deg, #0b0a18 0%, transparent 28%), url("${HERO_IMAGE}")` }}>
          <div className="hero-stars" aria-hidden="true"><span>✦</span><span>✧</span><span>·</span><span>✦</span><span>✧</span></div>
          <div className="hero-content">
            <div className="eyebrow"><span className="eyebrow-line" /> SEU CANTINHO NA INTERNET <span className="eyebrow-star">✦</span></div>
            <h1>um universo<br /><em>chamado você.</em></h1>
            <p>Entre, fique à vontade e sintonize na minha frequência.<br className="desktop-break" /> Esse espaço é todinho seu.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#sobre">explorar meu espaço <ChevronRight size={16} /></a>
              <button className="text-button" onClick={openEditor}><Sparkles size={15} /> personalizar</button>
            </div>
          </div>
          <div className="hero-caption"><span>FIG. 01</span><i /> <span>UMA NOITE ENTRE ESTRELAS</span></div>
          <a className="scroll-cue" href="#sobre" aria-label="Rolar para conhecer"><ArrowDown size={16} /></a>
        </section>

        <div className="ticker" aria-label="Interesses"><div className="ticker-track"><span>ANIME & MANGÁ</span><b>✦</b><span>MÚSICA SEM FIM</span><b>✧</b><span>NOITES CRIATIVAS</span><b>✦</b><span>UM CANTINHO SÓ MEU</span><b>✧</b><span>ANIME & MANGÁ</span><b>✦</b><span>MÚSICA SEM FIM</span><b>✧</b></div></div>

        <div className="content-grid">
          <div className="main-column">
            <section id="sobre" className="about-section section-block">
              <div className="section-label"><span>01</span><i /> <span>UM POUCO DE MIM</span></div>
              <div className="about-heading-row">
                <div><h2>oi, eu sou <span>{profile.name}</span><b className="heading-spark">✦</b></h2><p className="section-subtitle">um pequeno espaço para tudo que faz meu mundo girar.</p></div>
                <button className="icon-button about-edit" onClick={openEditor} aria-label="Editar perfil"><Pencil size={15} /></button>
              </div>
              <div className="profile-card">
                <div className="avatar-art" style={{ backgroundImage: `linear-gradient(0deg,rgba(12,10,27,.55),transparent 55%), url("${HERO_IMAGE}")` }}><div className="avatar-ring"><span>✧</span></div><span className="avatar-online"><i /> online agora</span></div>
                <div className="profile-copy"><div className="profile-name-row"><div><span className="profile-kicker">PRAZER, EU SOU</span><h3>{profile.name}</h3></div><span className="profile-pronouns">{profile.pronouns}</span></div><p className="profile-about">{profile.about}</p><div className="mood-line"><span className="mood-icon">☾</span><span>{profile.mood}</span><span className="mood-pulse" /></div><button className="inline-edit" onClick={openEditor}>essa história é sua — edite aqui <ChevronRight size={13} /></button></div>
              </div>
              <div className="fact-row">{details.map((detail) => <div className="fact-card" key={detail.label}><span className="fact-icon">{detail.icon}</span><div><span className="fact-label">{detail.label}</span><p>{detail.value}</p></div></div>)}</div>
            </section>

            <section id="galeria" className="gallery-section section-block">
              <div className="section-label"><span>02</span><i /> <span>PEQUENOS MOMENTOS</span><span className="label-end">{String(profile.photos.length).padStart(2, "0")} / 06</span></div>
              <div className="section-heading-row"><div><h2>minha <em>galeria.</em></h2><p className="section-subtitle">memórias, detalhes e pedacinhos do meu mundo.</p></div><button className="add-photo-button" onClick={() => photoInputRef.current?.click()}><Plus size={15} /> adicionar foto</button></div>
              <input ref={photoInputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={addPhotos} aria-label="Escolher fotos para a galeria" />
              {profile.photos.length ? <div className="photo-grid">{profile.photos.map((photo, index) => <figure className={`photo-card photo-${index % 3}`} key={`${photo.src.slice(0, 28)}-${index}`}><img src={photo.src} alt={photo.caption || `Foto ${index + 1}`} /><figcaption>{photo.caption || `momento ${String(index + 1).padStart(2, "0")}`}<button onClick={() => removePhoto(index)} aria-label={`Remover ${photo.caption}`}><X size={14} /></button></figcaption></figure>)}{profile.photos.length < 6 && <button className="photo-add-tile" onClick={() => photoInputRef.current?.click()}><ImagePlus size={22} /><span>mais um momento</span></button>}</div> : <button className="gallery-empty" onClick={() => photoInputRef.current?.click()}><span className="empty-polaroid polaroid-one"><span>✦</span></span><span className="empty-polaroid polaroid-two"><span>♡</span></span><span className="empty-polaroid polaroid-three"><span>☾</span></span><span className="gallery-empty-copy"><span className="empty-title">suas memórias começam aqui</span><span>Adicione até 6 fotos e deixe sua galeria com a sua cara.</span><span className="empty-cta"><Camera size={14} /> escolher fotos <ChevronRight size={14} /></span></span></button>}
              <p className="gallery-note"><Sparkles size={13} /> Suas fotos ficam guardadas neste navegador. São redimensionadas para carregar rapidinho.</p>
            </section>

            <section id="vibes" className="vibes-section section-block">
              <div className="section-label"><span>03</span><i /> <span>NO MEU FONE AGORA</span></div>
              <div className="vibes-card"><div className="vibes-art"><div className="disc-shadow" /><div className="vibes-disc"><span>orbit<br /><i>side A</i></span></div><div className="vibes-sparkle sparkle-a">✦</div><div className="vibes-sparkle sparkle-b">✧</div></div><div className="vibes-copy"><span className="profile-kicker">TRILHA SONORA PESSOAL</span><h3>uma música para<br /><em>ficar por aqui.</em></h3><p>{profile.music}</p><div className="vibes-bottom"><div className="waveform" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ height: `${9 + ((index * 17 + 13) % 27)}px`, animationDelay: `${index * 38}ms` }} />)}</div><button className="round-play" onClick={() => { setActiveAudio("song"); if (activeAudio === "song") void toggleAudio(); }} aria-label="Tocar minha música"><Play size={15} fill="currentColor" /></button></div></div></div>
            </section>

            <section className="closing-note"><span className="closing-star">✦</span><p>se você chegou até aqui,<br /><em>já faz parte do meu universo.</em></p><Heart size={17} /></section>
          </div>

          <aside className="side-column">
            <section className="radio-card" aria-label="Player de música e rádio">
              <div className="radio-topline"><div className="radio-icon"><RadioTower size={17} /></div><span className="live-label"><i /> {activeAudio === "radio" && isPlaying ? "NO AR" : "SINTONIZAR"}</span></div>
              <span className="radio-overline">MEU CANTINHO, MINHA FREQUÊNCIA</span>
              <h2>{activeAudio === "radio" ? profile.radioName : profile.songName}</h2>
              <p className="radio-description">{activeAudio === "radio" ? "a trilha sonora desse pequeno universo." : "o som que está morando na minha cabeça."}</p>
              <div className="audio-mode-switch"><button className={activeAudio === "radio" ? "active" : ""} onClick={() => setActiveAudio("radio")}><Radio size={13} /> rádio</button><button className={activeAudio === "song" ? "active" : ""} onClick={() => setActiveAudio("song")}><Music2 size={13} /> música</button></div>
              <div className="tuning-row"><div className="station-art"><Disc3 size={25} className={isPlaying ? "disc-spinning" : ""} /><span className="station-art-dot" /></div><div className="station-meta"><span>{audioKind}</span><strong>{audioTitle}</strong><small>{audioSource ? "link configurado" : "esperando sua sintonia"}</small></div><span className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span></div>
              <div className="audio-progress"><span className={isPlaying ? "progress-fill playing" : "progress-fill"} /></div>
              <div className="player-controls"><button className="small-control" onClick={() => { setActiveAudio("radio"); setAudioMessage(""); }} aria-label="Selecionar rádio"><Radio size={15} /></button><button className="play-button" onClick={() => void toggleAudio()} aria-label={isPlaying ? "Pausar" : "Tocar"}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><button className="small-control" onClick={() => { setActiveAudio("song"); setAudioMessage(""); }} aria-label="Selecionar música"><Music2 size={15} /></button><div className="volume-control"><Volume2 size={15} /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} style={{ background: `linear-gradient(90deg, #cbb8ff ${volume}%, rgba(220, 210, 255, .16) ${volume}%)` }} /></div></div>
              <audio ref={audioRef} src={audioSource || undefined} preload="none" onPlay={() => { setIsPlaying(true); setAudioMessage(""); }} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onError={() => { if (audioSource) { setIsPlaying(false); setAudioMessage("Esse endereço não respondeu como áudio. Confira se é um link direto de transmissão."); } }} />
              {audioMessage ? <p className="audio-message">{audioMessage}</p> : !audioSource ? <p className="audio-hint">Cole o link direto da sua rádio ou música para dar o play. <button onClick={openEditor}>configurar <ChevronRight size={12} /></button></p> : <p className="audio-hint audio-connected"><AudioLines size={13} /> pronta para tocar quando você quiser</p>}
            </section>

            <section className="side-note-card"><div className="note-top"><span>✳</span><span className="note-label">UM BILHETE</span></div><p>“Às vezes, tudo o que a gente precisa é de um lugarzinho onde possa ser <em>exatamente quem é.</em>”</p><span className="note-signature">— pra você, com carinho ✦</span></section>

            <section className="mini-info-card"><div className="section-label"><span>DETALHES</span><i /></div><div className="mini-detail"><span className="mini-detail-icon">◌</span><span>status</span><strong>{profile.mood}</strong></div><div className="mini-detail"><span className="mini-detail-icon">♡</span><span>pronomes</span><strong>{profile.pronouns}</strong></div><div className="mini-detail"><span className="mini-detail-icon">✦</span><span>anime do coração</span><strong>{profile.anime}</strong></div><button className="mini-edit" onClick={openEditor}>editar meu perfil <Pencil size={13} /></button></section>

            <section className="social-card"><div className="social-orbit"><Instagram size={19} /></div><div><span className="profile-kicker">A GENTE SE ENCONTRA LÁ?</span><p>mais pedacinhos do meu dia</p></div>{profile.instagram ? <a href={normalizeSocial(profile.instagram)} target="_blank" rel="noreferrer" aria-label="Abrir Instagram"><ExternalLink size={16} /></a> : <button onClick={openEditor} aria-label="Adicionar Instagram"><Plus size={17} /></button>}</section>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><a className="wordmark footer-mark" href="#inicio"><span className="wordmark-spark">✦</span> orbit<span className="wordmark-dot">.</span></a><span>feito com um pouquinho de magia <span className="footer-heart">♡</span></span><a href="#inicio" className="back-top">VOLTAR AO TOPO ↑</a></footer>

      {notice && <div className="toast-message" role="status"><Check size={16} />{notice}</div>}
      {editorOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="modal-header"><div><span className="profile-kicker">SEU ESPAÇO, SUAS REGRAS</span><h2 id="editor-title">deixe com a <em>sua cara.</em></h2></div><button className="icon-button" onClick={() => setEditorOpen(false)} aria-label="Fechar"><X size={18} /></button></div><p className="modal-intro">Troque os exemplos pelo que é seu. As mudanças ficam salvas neste navegador.</p><form onSubmit={saveProfile}><div className="form-grid"><label>como quer ser chamado(a)?<input maxLength={30} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Seu nome ou apelido" /></label><label>pronomes<input maxLength={24} value={draft.pronouns} onChange={(event) => setDraft({ ...draft, pronouns: event.target.value })} placeholder="ex.: ela/dela" /></label><label>onde vive sua órbita?<input maxLength={48} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Cidade, estado ou universo" /></label><label>status / vibe<input maxLength={60} value={draft.mood} onChange={(event) => setDraft({ ...draft, mood: event.target.value })} placeholder="o que está sentindo?" /></label><label className="form-wide">um pouco sobre você<textarea maxLength={240} rows={3} value={draft.about} onChange={(event) => setDraft({ ...draft, about: event.target.value })} placeholder="Conte o que você quiser..." /></label><label>anime favorito<input maxLength={48} value={draft.anime} onChange={(event) => setDraft({ ...draft, anime: event.target.value })} placeholder="ex.: meu anime favorito" /></label><label>música / playlist<input maxLength={48} value={draft.music} onChange={(event) => setDraft({ ...draft, music: event.target.value })} placeholder="ex.: minha trilha sonora" /></label><label>nome da sua rádio<input maxLength={36} value={draft.radioName} onChange={(event) => setDraft({ ...draft, radioName: event.target.value })} placeholder="ex.: rádio da madrugada" /></label><label>link direto da rádio<input type="url" value={draft.radioUrl} onChange={(event) => setDraft({ ...draft, radioUrl: event.target.value })} placeholder="https://.../stream.mp3" /></label><label>nome da música<input maxLength={36} value={draft.songName} onChange={(event) => setDraft({ ...draft, songName: event.target.value })} placeholder="nome da faixa" /></label><label>link direto da música<input type="url" value={draft.songUrl} onChange={(event) => setDraft({ ...draft, songUrl: event.target.value })} placeholder="https://.../musica.mp3" /></label><label className="form-wide">Instagram (opcional)<input value={draft.instagram} onChange={(event) => setDraft({ ...draft, instagram: event.target.value })} placeholder="@seuusuario ou link do perfil" /></label></div><p className="privacy-note"><Radio size={14} /> Use endereços diretos de áudio (MP3, AAC ou OGG); links do YouTube não funcionam como stream. Fotos e dados ficam salvos neste navegador — não em uma conta online.</p><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setEditorOpen(false)}>cancelar</button><button type="submit" className="save-button"><Check size={16} /> salvar meu espaço</button></div></form></section></div>}
    </div>
  );
}
