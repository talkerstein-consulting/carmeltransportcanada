"use client";

// React Bits Pro contact-2 (contact form with company info), driving Carmel's quote, contact and application forms.
import { motion } from "motion/react";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown, Clock, Mail, MapPin, Paperclip, Phone } from "lucide-react";
import type { Form, FormField, Heading } from "@/lib/content";
import { OFFICE, QUOTE_EMAIL, splitAccent } from "@/lib/content";
import { cn } from "@/lib/utils";

type Map = { name: string; src: string };

const line = "w-full border-b border-input bg-transparent pb-3 pt-1 text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-brand aria-[invalid=true]:border-destructive";

function Field({ f, id, error }: { f: FormField; id: string; error?: string }) {
  const label = (f.label || f.options[0] || f.name).replace(/\*$/, "");
  // A first option that repeats the label is a prompt, not a choice.
  const opts = f.kind === "select" && f.options[0] && (f.options[0].toLowerCase() === label.toLowerCase() || /^(service type|our location)$/i.test(f.options[0])) ? f.options.slice(1) : f.options;
  const [file, setFile] = useState("");
  const common = { id, name: f.name, required: f.required, "aria-invalid": !!error || undefined, "aria-describedby": error ? `${id}-err` : undefined };
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-baseline gap-1 text-sm font-semibold text-ink">
        {label}{f.required ? <span className="text-destructive" aria-hidden>*</span> : <span className="ml-auto text-xs font-normal text-muted-foreground">Optional</span>}
      </label>
      {f.kind === "select" ? (
        <div className="relative">
          <select {...common} defaultValue="" className={cn(line, "appearance-none pr-8")}>
            <option value="" disabled>Choose…</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-2 h-4 w-4 text-muted-foreground" />
        </div>
      ) : f.kind === "textarea" ? (
        <textarea {...common} rows={3} className={cn(line, "resize-none")} />
      ) : f.type === "file" ? (
        <label htmlFor={id} className={cn(line, "flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-brand")}>
          <Paperclip className="h-4 w-4" />{file || "Choose a file"}
          <input {...common} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
        </label>
      ) : (
        <input {...common} type={f.type} className={line}
          autoComplete={f.type === "email" ? "email" : f.type === "tel" ? "tel" : /company/i.test(label) ? "organization" : /name/i.test(label) ? "name" : undefined} />
      )}
      {error && <p id={`${id}-err`} className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export default function Contact2({ eyebrow, title, html, note, form, formTitle, maps, mapsTitle }: {
  eyebrow?: string; title?: Heading; html?: string; note?: string; form: Form; formTitle?: string; maps?: Map[]; mapsTitle?: string;
}) {
  const uid = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [map, setMap] = useState(0);
  const t = splitAccent(title);
  const fields = form.fields.filter((f) => f.kind !== "submit");
  const submit = form.fields.find((f) => f.kind === "submit")?.text ?? "Send";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const el of Array.from(e.currentTarget.elements) as (HTMLInputElement | HTMLSelectElement)[]) {
      if (!el.name || el.checkValidity()) continue;
      next[el.name] = el.validity.valueMissing
        ? el.type === "file" ? "Please attach your resume." : el.tagName === "SELECT" ? "Please choose an option." : "This field is required."
        : el.type === "email" ? "Enter an email address like name@company.com." : el.validationMessage;
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus(); setSent(false); return; }
    setSent(true);
  };

  return (
    <section className={cn("w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24", maps ? "bg-white" : "bg-brand-soft/60")} id="quote">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-between">
            {maps ? (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <h2 className="mb-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{mapsTitle}</h2>
                <div role="tablist" aria-label={mapsTitle} className="mb-4 flex flex-wrap gap-2">
                  {maps.map((m, i) => (
                    <button key={m.name} type="button" role="tab" aria-selected={map === i} onClick={() => setMap(i)}
                      className={cn("inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors",
                        map === i ? "bg-brand text-white" : "bg-mist text-ink hover:bg-brand-soft")}>
                      <MapPin className="h-4 w-4" aria-hidden />
                      {m.name}
                    </button>
                  ))}
                </div>
                <div role="tabpanel" className="overflow-hidden rounded-3xl bg-mist">
                  <iframe key={map} src={maps[map].src} title={`Map of Carmel Transport, ${maps[map].name}`} loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-[380px] w-full border-0 sm:h-[460px]" />
                </div>
              </motion.div>
            ) : (
              <div>
                {eyebrow && <p className="text-sm font-semibold uppercase text-brand">{eyebrow}</p>}
                <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="mb-5 mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                  {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
                </motion.h2>
                {html && <div className="prose-carmel max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: html }} />}
              </div>
            )}

            {!maps && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
                className="mt-12 space-y-4 lg:mt-0">
                {[
                  { icon: Phone, text: OFFICE.text, href: OFFICE.href },
                  { icon: Mail, text: QUOTE_EMAIL, href: `mailto:${QUOTE_EMAIL}` },
                  { icon: Clock, text: "Open 24 / 7 / 365" },
                  { icon: MapPin, text: "18-25 North Rivermede, Concord, ON, Canada L4K 5V4" },
                ].map(({ icon: Icon, text, href }) => (
                  <p key={text} className="flex items-center gap-3 text-[15px] font-medium text-ink">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand"><Icon className="h-4 w-4" /></span>
                    {href ? <a href={href} className="inline-flex min-h-10 items-center hover:text-brand">{text}</a> : text}
                  </p>
                ))}
                {note && <div className="prose-carmel pt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: note }} />}
              </motion.div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_24px_60px_-28px_rgba(19,32,52,0.35)] sm:p-10">
            {formTitle && <h2 className="mb-8 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{formTitle}</h2>}
            <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
              onSubmit={handleSubmit} noValidate aria-label={formTitle || title?.text || "Request a quote"} className="space-y-7">
              {fields.map((f) => <Field key={f.name} f={f} id={`${uid}-${f.name}`} error={errors[f.name]} />)}
              <button type="submit"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sun px-10 text-base font-semibold text-ink transition-colors hover:bg-sun-strong sm:w-auto">
                {submit}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p role="status" aria-live="polite" className={cn("text-sm", sent && "rounded-2xl bg-sun-soft p-4 text-ink")}>
                {sent && <>Thanks — online submission isn’t connected yet. Please call <a className="font-semibold text-brand underline" href={OFFICE.href}>{OFFICE.text}</a> or email <a className="font-semibold text-brand underline" href={`mailto:${QUOTE_EMAIL}`}>{QUOTE_EMAIL}</a>.</>}
              </p>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
