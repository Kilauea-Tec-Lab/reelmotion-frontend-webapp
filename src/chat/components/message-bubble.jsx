import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  DollarSign,
  Flag,
  HelpCircle,
  MessageCircle,
  Pencil,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { SUPPORT_WHATSAPP_URL } from "../../utils/support";
import GenerationCard from "./generation-card";

/**
 * Botones de accion que el agente adjunta al mensaje (msg.actions).
 */
const MessageActions = memo(function MessageActions({
  msg,
  isSending,
  onOpenTokenModal,
  onQuickAction,
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (msg.role !== "assistant") return null;
  if (!Array.isArray(msg.actions) || msg.actions.length === 0) return null;

  const hasEditor = msg.actions.includes("editor");
  const hasTokensSale = msg.actions.includes("tokens_sale");
  const hasHowToUse = msg.actions.includes("how_to_use");
  const hasSupport = msg.actions.includes("support");

  if (!hasEditor && !hasTokensSale && !hasHowToUse && !hasSupport) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {hasEditor && (
        <button
          onClick={() => navigate("/editor")}
          className="px-3 py-1.5 bg-[#DC569D] hover:bg-[#c9458b] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Pencil size={14} />
          <span>{t("chat.actions.go-to-editor")}</span>
        </button>
      )}
      {hasTokensSale && (
        <>
          <button
            onClick={() => navigate("/app/pro")}
            className="px-3 py-1.5 bg-[#DC569D] hover:bg-[#c9458b] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>{t("chat.actions.subscribe")}</span>
          </button>
          <button
            onClick={onOpenTokenModal}
            className="px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <DollarSign size={14} />
            <span>{t("chat.actions.buy-tokens")}</span>
          </button>
        </>
      )}
      {hasHowToUse && (
        <button
          onClick={() => onQuickAction(t("chat.quick.how-to-use-message"))}
          disabled={isSending}
          className="px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HelpCircle size={14} />
          <span>{t("chat.quick.how-to-use")}</span>
        </button>
      )}
      {hasSupport && (
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1eb857] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <MessageCircle size={14} />
          <span>{t("chat.actions.whatsapp-support")}</span>
        </a>
      )}
    </div>
  );
});

/**
 * Un mensaje del chat con sus adjuntos y generaciones en curso.
 *
 * Estaba escrito dos veces dentro de chat-main (rama "chat existente" y rama
 * "preview"), y las copias ya habian divergido: la segunda habia perdido el
 * boton de reportar y el de editar adjunto.
 *
 * Va en memo y con el hover en estado local a proposito: antes cada tecla en el
 * input y cada paso del mouse por encima de un mensaje re-renderizaban el
 * historial completo, con sus <img> y <video> dentro.
 */
const MessageBubble = memo(function MessageBubble({
  msg,
  pendingGenerations,
  isSending,
  onOpenAttachment,
  onEditAttachment,
  onCopy,
  onResend,
  onReport,
  onOpenTokenModal,
  onQuickAction,
}) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  const isUser = msg.role === "user";
  const generations = pendingGenerations.filter(
    (g) => g.chat_message_id === msg.id,
  );

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex flex-col gap-2 max-w-[80%] relative ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Botones de acción */}
        {isHovered && (
          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
            <button
              onClick={() => onCopy(msg)}
              className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
              title={t("chat.copy-clipboard")}
            >
              <Copy size={14} className="text-white" />
            </button>
            <button
              onClick={() => onResend(msg)}
              className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
              title="Resend message"
            >
              <RotateCw size={14} className="text-white" />
            </button>
            {!isUser && (
              <button
                onClick={() => onReport(msg.id)}
                className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                title={t("chat.report-tooltip")}
                aria-label={t("chat.report-tooltip")}
              >
                <Flag size={14} className="text-white" />
              </button>
            )}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.attachments.map((attachment) => (
              <div
                key={attachment.id ?? attachment.url}
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onOpenAttachment(attachment)}
              >
                {(attachment.file_type === "image" ||
                  attachment.file_type === "video") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAttachment(attachment);
                    }}
                    className="absolute top-[-14px] right-[-14px] z-10 bg-primarioLogo hover:bg-[#ec77b5] text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm transition-colors"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
                {attachment.file_type === "image" ? (
                  <img
                    src={attachment.thumbnail_url || attachment.url}
                    alt="Attachment"
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                  />
                ) : attachment.file_type === "video" ? (
                  // Con thumbnail se pinta una imagen: antes cada video del
                  // historial se descargaba y decodificaba con autoPlay loop.
                  attachment.thumbnail_url ? (
                    <img
                      src={attachment.thumbnail_url}
                      alt="Video attachment"
                      loading="lazy"
                      decoding="async"
                      className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                    />
                  ) : (
                    // #t=0.1 hace que el navegador pinte ese frame en vez de un
                    // cuadro negro. Fallback mientras el backfill de thumbnails
                    // no ha pasado por este attachment.
                    <video
                      src={`${attachment.url}#t=0.1`}
                      className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  )
                ) : attachment.file_type === "audio" ? (
                  <div
                    className="flex items-center justify-center bg-[#2f2f2f] rounded-lg border border-gray-600 p-2 min-w-[260px] cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <audio src={attachment.url} controls className="w-full h-10" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-white"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <MessageActions
            msg={msg}
            isSending={isSending}
            onOpenTokenModal={onOpenTokenModal}
            onQuickAction={onQuickAction}
          />
        </div>

        {generations.map((g) => (
          <GenerationCard
            key={g.generation_id}
            mediaType={g.media_type}
            provider={g.provider}
            model={g.model}
            status={g.status}
            progress={g.progress}
            error={g.error}
          />
        ))}
      </div>
    </div>
  );
});

export default MessageBubble;
