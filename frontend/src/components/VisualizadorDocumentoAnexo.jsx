/* ==========================================================================
   ARQUIVO: VisualizadorDocumentoAnexo.jsx
   LOCALIZAÇÃO: /frontend/src/components/VisualizadorDocumentoAnexo.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO: Visualizador em tempo real de documentos e laudos médicos anexados
             (PDFs e imagens) com suporte a Split-View lado a lado, zoom,
             abertura em nova aba, download e dropzone integrado.
   ========================================================================== */

/* INÍCIO DO COMPONENTE VISUALIZADOR DE DOCUMENTO ANEXO */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UploadCloud,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Button from './Button';
import { Badge } from './ui/Badge';

/**
 * VisualizadorDocumentoAnexo
 * Renderiza documentos anexados (PDFs e imagens) ou a área de dropzone para upload.
 */
export default function VisualizadorDocumentoAnexo({
  arquivo = null,
  arquivoUrl = '',
  nomeArquivo = '',
  onArquivoChange = null,
  onRemover = null,
  readonly = false,
  tituloPainel = 'Laudo do Exame',
  style = {},
}) {
  const [zoom, setZoom] = useState(100);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  // Determina URL e nome do arquivo conforme tipo (File ou string)
  const { urlFinal, nomeFinal, ehArquivoFile, tipoMime } = useMemo(() => {
    if (arquivo instanceof File) {
      const objUrl = URL.createObjectURL(arquivo);
      return {
        urlFinal: objUrl,
        nomeFinal: arquivo.name,
        ehArquivoFile: true,
        tipoMime: arquivo.type || (arquivo.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      };
    }

    const urlStr = typeof arquivo === 'string' && arquivo ? arquivo : arquivoUrl;
    let nomeStr = nomeArquivo;
    if (!nomeStr && urlStr) {
      const partes = urlStr.split('/');
      nomeStr = partes[partes.length - 1] || 'laudo_exame.pdf';
    }

    const ehPdf = (nomeStr || urlStr || '').toLowerCase().includes('.pdf');
    return {
      urlFinal: urlStr || null,
      nomeFinal: nomeStr || 'Documento Anexo',
      ehArquivoFile: false,
      tipoMime: ehPdf ? 'application/pdf' : 'image/jpeg',
    };
  }, [arquivo, arquivoUrl, nomeArquivo]);

  // Limpeza de URL de objeto quando o componente desmonta ou o arquivo muda
  useEffect(() => {
    return () => {
      if (ehArquivoFile && urlFinal && urlFinal.startsWith('blob:')) {
        URL.revokeObjectURL(urlFinal);
      }
    };
  }, [ehArquivoFile, urlFinal]);

  // Identificação do formato para renderização adequada
  const ehPdf = useMemo(() => {
    if (!urlFinal && !nomeFinal) return false;
    return (
      tipoMime === 'application/pdf' ||
      nomeFinal.toLowerCase().endsWith('.pdf') ||
      (urlFinal && urlFinal.toLowerCase().includes('.pdf'))
    );
  }, [tipoMime, nomeFinal, urlFinal]);

  const ehImagem = useMemo(() => {
    if (!urlFinal && !nomeFinal) return false;
    const extensoesImg = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
    const nomeBaixo = nomeFinal.toLowerCase();
    const urlBaixo = (urlFinal || '').toLowerCase();
    return (
      tipoMime.startsWith('image/') ||
      extensoesImg.some((ext) => nomeBaixo.endsWith(ext) || urlBaixo.includes(ext))
    );
  }, [tipoMime, nomeFinal, urlFinal]);

  // Handlers de Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readonly) setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (readonly || !onArquivoChange) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onArquivoChange(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0] && onArquivoChange) {
      onArquivoChange(e.target.files[0]);
    }
  };

  // =========================================================================
  // CENÁRIO 1: NENHUM ARQUIVO SELECIONADO -> EXIBE DROPZONE INTEGRADA
  // =========================================================================
  if (!urlFinal) {
    return (
      <div
        className="visualizador-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '380px',
          padding: '2rem 1.5rem',
          backgroundColor: isDraggingOver
            ? 'rgba(59, 126, 72, 0.08)'
            : 'var(--cor-superficie, #FAF8F5)',
          border: isDraggingOver
            ? '2px dashed var(--cor-cta, #3B7E48)'
            : '2px dashed var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          ...style,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 83, 63, 0.08)',
            color: 'var(--cor-primaria, #7C533F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <UploadCloud size={32} strokeWidth={1.75} />
        </div>

        <h4
          style={{
            fontFamily: 'var(--fonte-titulo, Fraunces)',
            fontSize: '1.15rem',
            color: 'var(--cor-texto, #2E2824)',
            margin: '0 0 0.4rem 0',
          }}
        >
          Anexar Laudo do Exame (Split-View)
        </h4>

        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--cor-texto-suave, #5A5049)',
            maxWidth: '340px',
            lineHeight: 1.45,
            margin: '0 0 1.25rem 0',
          }}
        >
          Arraste e solte o arquivo em PDF ou foto do laboratório aqui, ou clique abaixo para selecionar do computador.
        </p>

        {!readonly && onArquivoChange && (
          <Button
            type="button"
            variante="secundario"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.55rem 1.15rem',
            }}
          >
            <FileText size={16} strokeWidth={2} />
            <span>Selecionar Laudo Digital</span>
          </Button>
        )}

        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            justifyContent: 'center',
          }}
        >
          <Badge variant="secondary" style={{ fontSize: '10px' }}>PDF Laboratorial</Badge>
          <Badge variant="secondary" style={{ fontSize: '10px' }}>JPG / PNG</Badge>
          <Badge variant="secondary" style={{ fontSize: '10px' }}>Até 10 MB</Badge>
        </div>

        <span
          style={{
            marginTop: '1rem',
            fontSize: '0.74rem',
            color: 'var(--cor-texto-suave, #5A5049)',
            fontStyle: 'italic',
          }}
        >
          💡 O laudo ficará aberto aqui ao lado enquanto você preenche os marcadores no formulário.
        </span>
      </div>
    );
  }

  // =========================================================================
  // CENÁRIO 2: ARQUIVO ANEXADO -> EXIBE VISUALIZADOR COM TOOLBAR COMPLETA
  // =========================================================================
  return (
    <div
      className="visualizador-documento-anexo"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--cor-superficie-elevada, #FFFFFF)',
        border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.18))',
        borderRadius: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* BARRA SUPERIOR DE FERRAMENTAS DO LAUDO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--cor-superficie, #FAF8F5)',
          borderBottom: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
          flexWrap: 'wrap',
          gap: '0.5rem',
          flexShrink: 0,
        }}
      >
        {/* Identificação do Arquivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: ehPdf ? 'rgba(201, 74, 56, 0.12)' : 'rgba(59, 126, 72, 0.12)',
              color: ehPdf ? '#C94A38' : 'var(--cor-cta, #3B7E48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {ehPdf ? <FileText size={16} strokeWidth={2} /> : <ImageIcon size={16} strokeWidth={2} />}
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--cor-texto, #2E2824)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={nomeFinal}
            >
              {nomeFinal}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--cor-texto-suave, #5A5049)' }}>
              {ehArquivoFile && arquivo?.size ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB • ` : ''}
              {ehPdf ? 'Documento PDF' : 'Imagem'}
            </div>
          </div>
        </div>

        {/* Controles de Ação (Nova Aba, Download, Zoom, Troca e Exclusão) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {/* Controles de Zoom para Imagens */}
          {ehImagem && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: 'var(--cor-superficie-elevada)',
                border: '1px solid var(--cor-borda-suave)',
                borderRadius: '6px',
                padding: '2px 4px',
                marginRight: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 20))}
                title="Diminuir Zoom"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '3px',
                  cursor: 'pointer',
                  color: 'var(--cor-texto)',
                  display: 'flex',
                }}
              >
                <ZoomOut size={13} strokeWidth={2} />
              </button>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  minWidth: '32px',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(250, z + 20))}
                title="Aumentar Zoom"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '3px',
                  cursor: 'pointer',
                  color: 'var(--cor-texto)',
                  display: 'flex',
                }}
              >
                <ZoomIn size={13} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                title="Redefinir Zoom (100%)"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '3px',
                  cursor: 'pointer',
                  color: 'var(--cor-texto-suave)',
                  display: 'flex',
                }}
              >
                <RotateCcw size={12} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Abrir em Nova Aba */}
          <a
            href={urlFinal}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir laudo completo em nova aba"
            style={{ textDecoration: 'none' }}
          >
            <Button
              type="button"
              variante="secundario"
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <ExternalLink size={12} strokeWidth={2} />
              <span>Nova Aba</span>
            </Button>
          </a>

          {/* Baixar Arquivo */}
          <a
            href={urlFinal}
            download={nomeFinal}
            title="Baixar arquivo do laudo"
            style={{ textDecoration: 'none' }}
          >
            <Button
              type="button"
              variante="secundario"
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Download size={12} strokeWidth={2} />
              <span>Baixar</span>
            </Button>
          </a>

          {/* Trocar Arquivo (quando editável) */}
          {!readonly && onArquivoChange && (
            <Button
              type="button"
              variante="secundario"
              onClick={() => fileInputRef.current?.click()}
              title="Trocar arquivo por outro laudo"
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <RefreshCw size={12} strokeWidth={2} />
              <span>Trocar</span>
            </Button>
          )}

          {/* Remover Laudo (quando editável) */}
          {!readonly && onRemover && (
            <button
              type="button"
              onClick={onRemover}
              title="Remover anexo do formulário"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 74, 56, 0.25)',
                color: '#C94A38',
                borderRadius: '6px',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201, 74, 56, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO DO LAUDO (PDF OU IMAGEM) */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#F5F2EC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ehPdf ? (
          /* Visualizador de PDF via object / iframe com suporte nativo e fallback */
          <object
            data={urlFinal}
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          >
            <iframe
              src={urlFinal}
              title={nomeFinal}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            >
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A5049' }}>
                <p>Seu navegador não oferece pré-visualização direta deste PDF.</p>
                <a
                  href={urlFinal}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--cor-cta)', fontWeight: 700 }}
                >
                  Clique aqui para abrir em nova aba
                </a>
              </div>
            </iframe>
          </object>
        ) : ehImagem ? (
          /* Visualizador de Imagens com suporte a Zoom e rolagem suave */
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={urlFinal}
              alt={nomeFinal}
              style={{
                maxWidth: zoom === 100 ? '100%' : 'none',
                maxHeight: zoom === 100 ? '100%' : 'none',
                width: zoom !== 100 ? `${zoom}%` : 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(46, 40, 36, 0.1)',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>
        ) : (
          /* Formato genérico com opção direta de download */
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <FileSpreadsheet size={48} color="var(--cor-primaria)" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--cor-texto)' }}>{nomeFinal}</h4>
            <p style={{ fontSize: '0.85rem', color: '#5A5049', margin: '0 0 1rem' }}>
              Este arquivo está anexado e pronto para envio.
            </p>
            <a href={urlFinal} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variante="secundario">Visualizar em Nova Aba</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE VISUALIZADOR DE DOCUMENTO ANEXO */
