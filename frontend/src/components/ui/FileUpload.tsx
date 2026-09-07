'use client';

import * as React from 'react';
import { FileText, Loader2, Paperclip, RotateCcw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Campo de anexo com area de arrastar-e-soltar.
 *
 * A validacao daqui e conveniencia de UX, nao seguranca: o tipo declarado por
 * um arquivo e trivialmente falsificavel. Quem decide o que entra e o backend,
 * que confere os magic bytes e renomeia o objeto por uuid antes de gravar.
 *
 * Componente controlado: quem usa mantem o File em estado e reage ao onChange.
 */

export interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  /** Mime types aceitos, ex.: ['application/pdf', 'image/png']. Vazio = todos. */
  accept?: string[];
  maxSizeBytes?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  /** Erro vindo de fora (resposta do servidor, por exemplo). */
  error?: string | null;
  /** 0-100 enquanto envia; null/undefined quando nao ha envio em curso. */
  progress?: number | null;
  className?: string;
  id?: string;
}

const MB = 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function extensaoLegivel(mime: string): string {
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('image/')) return mime.slice(6).toUpperCase();
  return mime;
}

export function FileUpload({
  value,
  onChange,
  accept = [],
  maxSizeBytes = 20 * MB,
  disabled = false,
  label = 'Anexar arquivo',
  hint,
  error,
  progress = null,
  className,
  id,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = React.useState(false);
  const [erroLocal, setErroLocal] = React.useState<string | null>(null);

  const reactId = React.useId();
  const inputId = id ?? `file-upload-${reactId}`;
  const enviando = progress !== null && progress !== undefined;
  const bloqueado = disabled || enviando;
  const mensagemErro = error ?? erroLocal;

  const validar = React.useCallback(
    (file: File): string | null => {
      if (accept.length > 0 && !accept.includes(file.type)) {
        const aceitos = accept.map(extensaoLegivel).join(', ');
        return `Formato não aceito. Envie ${aceitos}.`;
      }
      if (file.size > maxSizeBytes) {
        return `Arquivo de ${formatFileSize(file.size)} — o limite é ${formatFileSize(maxSizeBytes)}.`;
      }
      if (file.size === 0) {
        return 'O arquivo está vazio.';
      }
      return null;
    },
    [accept, maxSizeBytes],
  );

  const receber = React.useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const problema = validar(file);
      setErroLocal(problema);
      onChange(problema ? null : file);
    },
    [onChange, validar],
  );

  const abrirSeletor = () => {
    if (bloqueado) return;
    inputRef.current?.click();
  };

  const limpar = (event: React.MouseEvent) => {
    event.stopPropagation();
    setErroLocal(null);
    onChange(null);
    // Sem isso, escolher o mesmo arquivo de novo nao dispara change.
    if (inputRef.current) inputRef.current.value = '';
  };

  // Com arquivo escolhido, a area deixa de ser um botao: ela passa a conter
  // botoes proprios (Trocar/Remover), e botao dentro de botao quebra a
  // semantica e confunde leitor de tela. Arrastar para substituir continua
  // funcionando nos dois estados.
  const areaClicavel = !value && !bloqueado;

  return (
    <div className={cn('w-full', className)}>
      <div
        role={areaClicavel ? 'button' : undefined}
        tabIndex={areaClicavel ? 0 : undefined}
        aria-disabled={bloqueado || undefined}
        aria-describedby={mensagemErro ? `${inputId}-erro` : undefined}
        onClick={areaClicavel ? abrirSeletor : undefined}
        onKeyDown={
          areaClicavel
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  abrirSeletor();
                }
              }
            : undefined
        }
        onDragOver={(event) => {
          event.preventDefault();
          if (!bloqueado) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(event) => {
          event.preventDefault();
          setArrastando(false);
          if (bloqueado) return;
          receber(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          arrastando ? 'border-primary bg-primary/5' : 'border-input',
          mensagemErro && 'border-destructive',
          bloqueado && 'opacity-60',
          areaClicavel && 'cursor-pointer hover:border-primary/60',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept.join(',')}
          disabled={bloqueado}
          onChange={(event) => receber(event.target.files?.[0])}
        />

        {value ? (
          <div className="flex w-full items-center gap-3 text-left">
            <FileText className="h-8 w-8 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
            </div>
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={abrirSeletor}
                  className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={limpar}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remover ${value.name}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {arrastando ? (
              <Upload className="h-7 w-7 text-primary" aria-hidden />
            ) : (
              <Paperclip className="h-7 w-7 text-muted-foreground" aria-hidden />
            )}
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {hint ?? 'Arraste aqui ou clique para escolher'}
            </p>
            {(accept.length > 0 || maxSizeBytes) && (
              <p className="text-[11px] text-muted-foreground">
                {accept.length > 0 && `${accept.map(extensaoLegivel).join(', ')} · `}
                até {formatFileSize(maxSizeBytes)}
              </p>
            )}
          </>
        )}

        {enviando && (
          <div className="mt-1 w-full" aria-live="polite">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Enviando… {Math.round(progress ?? 0)}%
            </p>
          </div>
        )}
      </div>

      {mensagemErro && (
        <p
          id={`${inputId}-erro`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive"
        >
          <RotateCcw className="h-3 w-3 shrink-0" aria-hidden />
          {mensagemErro}
        </p>
      )}
    </div>
  );
}
