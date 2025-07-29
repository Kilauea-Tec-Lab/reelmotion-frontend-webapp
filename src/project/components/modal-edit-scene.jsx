import { useState, useEffect } from "react";
import { X, Play } from "lucide-react";
import Cookies from "js-cookie";

function ModalEditScene({ isOpen, onClose, scene, onSceneUpdated }) {
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scene) {
      setSceneName(scene.name || "");
      setSceneDescription(scene.description || "");
    }
  }, [scene]);

  const handleClose = () => {
    setSceneName("");
    setSceneDescription("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sceneName.trim() || !sceneDescription.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}scenes/${scene.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            name: sceneName,
            description: sceneDescription,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        onSceneUpdated(responseData.data);
        handleClose();
      } else {
        console.error("Error updating scene:", responseData);
      }
    } catch (error) {
      console.error("Error updating scene:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !scene) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Edit Scene
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Video Preview */}
          {scene.video_url && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <h3 className="text-white montserrat-medium text-sm mb-3">
                Scene Video
              </h3>
              <video
                src={scene.video_url}
                controls
                className="w-full max-h-80 rounded-lg bg-black"
                poster={scene.prompt_image_url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Scene Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Scene Name *
            </label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Enter scene name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Scene Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Scene Description *
            </label>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Describe this scene and its role in your project..."
              rows={4}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Scene Info */}
          <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
            <h3 className="text-white montserrat-medium text-sm mb-3">
              Scene Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {scene.characters && scene.characters.length > 0 && (
                <div>
                  <p className="text-gray-400">Characters:</p>
                  <p className="text-white font-medium">
                    {console.log(scene.characters)}
                    {scene.characters.map((char) => char.name).join(", ")}
                  </p>
                </div>
              )}
              {scene.spot && (
                <div>
                  <p className="text-gray-400">Location:</p>
                  <p className="text-white font-medium">{scene.spot.name}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Created:</p>
                <p className="text-white font-medium">
                  {new Date(scene.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !sceneName.trim() || !sceneDescription.trim() || isLoading
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              {isLoading ? "Updating..." : "Update Scene"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditScene;
