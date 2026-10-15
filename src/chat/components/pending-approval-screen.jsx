import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Clock } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { notifyAppLogout } from "../../utils/nativeBridge";

// Lead B2B con score bajo: espera a que un admin lo apruebe (el backend bloquea las escrituras).
function PendingApprovalScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const logOut = () => {
    Cookies.remove("token");
    notifyAppLogout("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-primarioDark text-white">
      <div className="max-w-md w-full text-center bg-[#161619] border border-gray-700 rounded-3xl p-8">
        <img src="/logos/logo_reelmotion.webp" alt="Reelmotion AI" className="h-8 mx-auto mb-6" />
        <div className="w-14 h-14 bg-gradient-to-br from-[#DC569D] to-[#F2D543] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">{t("approval.pending.title")}</h1>
        <p className="text-gray-400 text-sm mt-3 mb-8">{t("approval.pending.body")}</p>
        <button
          type="button"
          onClick={logOut}
          className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          {t("approval.pending.logout")}
        </button>
      </div>
    </div>
  );
}

export default PendingApprovalScreen;
