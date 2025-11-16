import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isProfileComplete } from "../utils/profileCheck";

// Icon components
const EditIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PaletteIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SaveIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [taste, setTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImages, setProfileImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        // Get user info
        const userRes = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setUser(userRes.data);
        setFormData({
          name: userRes.data.name || "",
          age: userRes.data.age || "",
          gender: userRes.data.gender || "",
          birthday: userRes.data.birthday || "",
          location: userRes.data.location || "",
          city: userRes.data.city || "",
        });
        
        // Set profile images
        if (userRes.data.profileImages && Array.isArray(userRes.data.profileImages)) {
          setProfileImages(userRes.data.profileImages);
          setImagePreviews(userRes.data.profileImages);
        } else {
          setProfileImages([]);
          setImagePreviews([]);
        }

        // Get taste preferences
        const tasteRes = await axios.get(`http://localhost:5001/api/taste/${userId}`);
        setTaste(tasteRes.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const newImages = [...profileImages];
      const newPreviews = [...imagePreviews];
      
      if (index < 2) {
        newImages[index] = base64String;
        newPreviews[index] = base64String;
      } else {
        newImages[1] = base64String;
        newPreviews[1] = base64String;
      }
      
      setProfileImages(newImages);
      setImagePreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...profileImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setProfileImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    
    const finalBirthday = formData.birthday || user?.birthday;
    const finalGender = formData.gender || user?.gender;

    if (!finalBirthday || finalBirthday === "") {
      setError("Please enter your date of birth. This field is required.");
      setTimeout(() => setError(""), 5000);
      return;
    }
    
    if (!finalGender || finalGender === "") {
      setError("Please select your gender. This field is required.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSaving(true);

    try {
      const userId = localStorage.getItem("userId");
      
      const updateData = {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        birthday: formData.birthday,
        location: formData.location,
        city: formData.city,
      };
      
      if (profileImages.length > 0) {
        updateData.profileImages = profileImages;
      }
      
      const res = await axios.put(`http://localhost:5001/api/user/${userId}`, updateData);
      
      if (profileImages.length > 0) {
        try {
          await axios.post(`http://localhost:5001/api/user/${userId}/images`, {
            images: profileImages
          });
        } catch (imgErr) {
          console.error("Error uploading images:", imgErr);
        }
      }
      
      setUser(res.data.user);
      setEditing(false);
      setSuccess("Profile updated successfully! 🎉");
      
      const profileComplete = isProfileComplete(res.data.user);
      const hasPreferences = taste && (
        (taste.movies && taste.movies.length > 0) ||
        (taste.music && taste.music.length > 0) ||
        (taste.shows && taste.shows.length > 0)
      );
      
      setTimeout(() => {
        if (profileComplete && !hasPreferences) {
          const goToPreferences = window.confirm(
            "Your profile is complete! Would you like to set your entertainment preferences now?\n\n" +
            "This will help us find better matches for you."
          );
          if (goToPreferences) {
            navigate("/age-preference");
          }
        } else if (profileComplete && hasPreferences) {
          const goToMatches = window.confirm(
            "Your profile is complete! Would you like to view your matches?"
          );
          if (goToMatches) {
            navigate("/match-list");
          }
        }
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || "Failed to update profile";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            top: `${mousePosition.y * 0.3}%`,
            left: `${mousePosition.x * 0.3}%`,
            transition: "all 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            top: `${100 - mousePosition.y * 0.3}%`,
            right: `${100 - mousePosition.x * 0.3}%`,
            transition: "all 0.3s ease-out",
            animationDelay: "1s",
          }}
        />
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="w-full sm:w-auto overflow-visible">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2" style={{ lineHeight: '1.3', paddingTop: '0.15em', overflow: 'visible' }}>
              My Profile
            </h1>
            {!isProfileComplete(user) && !editing && (
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">
                <span>⚠️</span>
                <span>Complete your profile</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <EditIcon className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => navigate("/age-preference")}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <PaletteIcon className="w-5 h-5" />
                  <span>Preferences</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: user?.name || "",
                      age: user?.age || "",
                      gender: user?.gender || "",
                      birthday: user?.birthday || "",
                      location: user?.location || "",
                      city: user?.city || "",
                    });
                    if (user?.profileImages && Array.isArray(user.profileImages)) {
                      setProfileImages(user.profileImages);
                      setImagePreviews(user.profileImages);
                    } else {
                      setProfileImages([]);
                      setImagePreviews([]);
                    }
                    setError("");
                    setSuccess("");
                  }}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{success}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-shake">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {user && (
          <div className="relative mb-6">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
            
            {/* Glassmorphism Card */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Account Information</h2>

              {/* Profile Images */}
              <div className="mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Profile Images (Optional - Max 2)</h3>
                {!editing ? (
                  <div className="flex flex-wrap gap-4">
                    {user.profileImages && Array.isArray(user.profileImages) && user.profileImages.length > 0 ? (
                      user.profileImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Profile ${idx + 1}`}
                            className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl border-2 border-white/20 shadow-lg group-hover:border-purple-400/50 transition-all duration-300"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-white/60 italic">No images uploaded. Images will be auto-generated based on your gender when you save your profile.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1].map((index) => (
                        <div key={index} className="relative">
                          <label className="block text-sm font-semibold text-white/90 mb-2">
                            Image {index + 1} {index === 0 ? "(Optional)" : "(Optional)"}
                          </label>
                          {imagePreviews[index] ? (
                            <div className="relative group">
                              <img
                                src={imagePreviews[index]}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-48 sm:h-56 object-cover rounded-xl border-2 border-white/20 shadow-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-white/30 rounded-xl p-6 sm:p-8 text-center bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="hidden"
                                id={`image-upload-${index}`}
                              />
                              <label
                                htmlFor={`image-upload-${index}`}
                                className="cursor-pointer text-purple-300 hover:text-purple-200 font-semibold transition-colors duration-300"
                              >
                                📷 Click to upload image
                              </label>
                              <p className="text-xs text-white/50 mt-2">Max 5MB</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-white/70 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      💡 If you don't upload images, we'll generate profile pictures based on your gender using AI.
                    </p>
                  </div>
                )}
              </div>
              
              {!editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-sm mb-1">Name</p>
                      <p className="text-white font-semibold">{user.name}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-sm mb-1">Email</p>
                      <p className="text-white font-semibold">{user.email}</p>
                    </div>
                    {user.age && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Age</p>
                        <p className="text-white font-semibold">{user.age}</p>
                      </div>
                    )}
                    {user.gender && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Gender</p>
                        <p className="text-white font-semibold capitalize">{user.gender}</p>
                      </div>
                    )}
                    {user.birthday && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Birthday</p>
                        <p className="text-white font-semibold">{new Date(user.birthday).toLocaleDateString()}</p>
                      </div>
                    )}
                    {(user.location || user.city) && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Location</p>
                        <p className="text-white font-semibold">{user.city ? `${user.city}, ${user.location || ''}`.trim() : user.location}</p>
                      </div>
                    )}
                  </div>
                  {!isProfileComplete(user) && (
                    <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl text-sm text-blue-200 backdrop-blur-sm">
                      💡 Click "Edit Profile" to complete your profile information. Name, age, gender, and location are required.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-2">Age</label>
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                        placeholder="Your age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-2">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                      >
                        <option value="">Select Gender *</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Birthday *</label>
                    <input
                      type="date"
                      required
                      value={formData.birthday}
                      onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="e.g., New York"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-2">State/Region</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g., NY, California"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences Section */}
        {taste && (
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">My Preferences</h2>
              
              {taste.movies && taste.movies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🎬</span>
                    <span>Movies</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {taste.movies.map((movie, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg"
                      >
                        {typeof movie === "object" ? movie.title || movie.name : movie}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {taste.music && taste.music.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🎵</span>
                    <span>Music</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {taste.music.map((artist, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg"
                      >
                        {typeof artist === "object" ? artist.name || artist.title : artist}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {taste.shows && taste.shows.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📺</span>
                    <span>TV Shows</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {taste.shows.map((show, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg"
                      >
                        {typeof show === "object" ? show.title || show.name : show}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!taste.movies || taste.movies.length === 0) &&
               (!taste.music || taste.music.length === 0) &&
               (!taste.shows || taste.shows.length === 0) && (
                <p className="text-white/60">
                  No preferences set yet.{" "}
                  <button 
                    onClick={() => navigate("/age-preference")} 
                    className="text-purple-300 hover:text-purple-200 font-semibold underline transition-colors duration-200"
                  >
                    Add preferences
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/age-preference")}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2"
          >
            <PaletteIcon className="w-6 h-6" />
            <span>Go to Preference Browsing</span>
          </button>
          <button
            onClick={() => navigate("/match-list")}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>View Matches</span>
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default Profile;
