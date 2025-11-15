import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [taste, setTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImages, setProfileImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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
          occupationType: userRes.data.occupationType || "",
          university: userRes.data.university || "",
          jobRole: userRes.data.jobRole || "",
          company: userRes.data.company || "",
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
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
        // If trying to add more than 2, replace the last one
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
    // Validate required fields - check if they're set (either in form or already in user)
    const finalBirthday = formData.birthday || user?.birthday;
    const finalGender = formData.gender || user?.gender;

    if (!finalBirthday || finalBirthday === "") {
      alert("Please enter your date of birth. This field is required.");
      return;
    }
    
    if (!finalGender || finalGender === "") {
      alert("Please select your gender. This field is required.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      
      // Prepare update data - include all form fields
      const updateData = {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        birthday: formData.birthday,
        location: formData.location,
        city: formData.city,
        occupationType: formData.occupationType,
        university: formData.university,
        jobRole: formData.jobRole,
        company: formData.company,
      };
      
      // Only include profileImages if they exist
      if (profileImages.length > 0) {
        updateData.profileImages = profileImages;
      }
      
      // Update profile
      const res = await axios.put(`http://localhost:5001/api/user/${userId}`, updateData);
      
      // If images were uploaded, also send them via the images endpoint
      if (profileImages.length > 0) {
        try {
          await axios.post(`http://localhost:5001/api/user/${userId}/images`, {
            images: profileImages
          });
        } catch (imgErr) {
          console.error("Error uploading images:", imgErr);
          // Don't fail the whole update if image upload fails
        }
      }
      
      setUser(res.data.user);
      setEditing(false);
      
      // Check if profile is now complete
      const isProfileComplete = res.data.user.birthday && res.data.user.gender && res.data.user.occupationType;
      const hasPreferences = taste && (
        (taste.movies && taste.movies.length > 0) ||
        (taste.music && taste.music.length > 0) ||
        (taste.shows && taste.shows.length > 0)
      );
      
      if (isProfileComplete && !hasPreferences) {
        // Profile is complete but preferences are not set
        const goToPreferences = window.confirm(
          "Profile updated successfully! 🎉\n\n" +
          "Your profile is complete. Would you like to set your entertainment preferences now?\n\n" +
          "This will help us find better matches for you."
        );
        if (goToPreferences) {
          navigate("/age-preference");
        }
      } else {
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || "Failed to update profile";
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-4">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/age-preference")}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                >
                  Go to Preference Browsing
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                >
                  Save Changes
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
                      occupationType: user?.occupationType || "",
                      university: user?.university || "",
                      jobRole: user?.jobRole || "",
                      company: user?.company || "",
                    });
                    // Reset images to original
                    if (user?.profileImages && Array.isArray(user.profileImages)) {
                      setProfileImages(user.profileImages);
                      setImagePreviews(user.profileImages);
                    } else {
                      setProfileImages([]);
                      setImagePreviews([]);
                    }
                  }}
                  className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Account Information</h2>
              {(!user.birthday || !user.gender || !user.occupationType) && !editing && (
                <div className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                  ⚠️ Complete your profile
                </div>
              )}
            </div>

            {/* Profile Images Display/Upload */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Profile Images (Optional - Max 2)</h3>
              {!editing ? (
                <div className="flex gap-4">
                  {user.profileImages && Array.isArray(user.profileImages) && user.profileImages.length > 0 ? (
                    user.profileImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Profile ${idx + 1}`}
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-600"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">No images uploaded. Images will be auto-generated based on your gender when you save your profile.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[0, 1].map((index) => (
                      <div key={index} className="relative">
                        <label className="block text-sm font-semibold mb-2">
                          Image {index + 1} {index === 0 ? "(Optional)" : "(Optional)"}
                        </label>
                        {imagePreviews[index] ? (
                          <div className="relative">
                            <img
                              src={imagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border-2 border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              className="hidden"
                              id={`image-upload-${index}`}
                            />
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="cursor-pointer text-blue-400 hover:text-blue-300"
                            >
                              Click to upload image
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Max 5MB</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">
                    💡 If you don't upload images, we'll generate profile pictures based on your gender using AI.
                  </p>
                </div>
              )}
            </div>
            
            {!editing ? (
              <div className="space-y-3">
                <p className="text-gray-300"><span className="font-semibold">Name:</span> {user.name}</p>
                <p className="text-gray-300"><span className="font-semibold">Email:</span> {user.email}</p>
                {user.age ? (
                  <p className="text-gray-300"><span className="font-semibold">Age:</span> {user.age}</p>
                ) : (
                  <p className="text-gray-500 italic">Age: Not set</p>
                )}
                {user.gender ? (
                  <p className="text-gray-300"><span className="font-semibold">Gender:</span> {user.gender}</p>
                ) : (
                  <p className="text-gray-500 italic">Gender: Not set</p>
                )}
                {user.birthday ? (
                  <p className="text-gray-300"><span className="font-semibold">Birthday:</span> {new Date(user.birthday).toLocaleDateString()}</p>
                ) : (
                  <p className="text-gray-500 italic">Birthday: Not set</p>
                )}
                {user.location || user.city ? (
                  <p className="text-gray-300"><span className="font-semibold">Location:</span> {user.city ? `${user.city}, ${user.location || ''}`.trim() : user.location}</p>
                ) : (
                  <p className="text-gray-500 italic">Location: Not set</p>
                )}
                {user.occupationType ? (
                  <div>
                    <p className="text-gray-300"><span className="font-semibold">Occupation:</span> {user.occupationType === "student" ? "Student" : "Employed"}</p>
                    {user.occupationType === "student" && (
                      user.university ? (
                        <p className="text-gray-300 ml-4"><span className="font-semibold">University:</span> {user.university}</p>
                      ) : (
                        <p className="text-gray-500 italic ml-4">University: Not set</p>
                      )
                    )}
                    {user.occupationType === "job" && (
                      <>
                        {user.jobRole ? (
                          <p className="text-gray-300 ml-4"><span className="font-semibold">Role:</span> {user.jobRole}</p>
                        ) : (
                          <p className="text-gray-500 italic ml-4">Role: Not set</p>
                        )}
                        {user.company ? (
                          <p className="text-gray-300 ml-4"><span className="font-semibold">Company:</span> {user.company}</p>
                        ) : (
                          <p className="text-gray-500 italic ml-4">Company: Not set</p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Occupation: Not set</p>
                )}
                {(!user.birthday || !user.gender || !user.occupationType) && (
                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm text-blue-300">
                    💡 Click "Edit Profile" to complete your profile information. Date of birth and gender are required.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Age</label>
                    <input
                      type="number"
                      min="13"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full p-3 rounded bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full p-3 rounded bg-gray-700 text-white"
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
                  <label className="block text-sm font-semibold mb-2">Birthday *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthday}
                    onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="e.g., New York"
                      className="w-full p-3 rounded bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">State/Region</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., NY, California"
                      className="w-full p-3 rounded bg-gray-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Occupation Type</label>
                  <select
                    value={formData.occupationType}
                    onChange={(e) => setFormData({...formData, occupationType: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Occupation</option>
                    <option value="student">Student</option>
                    <option value="job">Employed</option>
                  </select>
                </div>
                {formData.occupationType === "student" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">University</label>
                    <input
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({...formData, university: e.target.value})}
                      className="w-full p-3 rounded bg-gray-700 text-white"
                    />
                  </div>
                )}
                {formData.occupationType === "job" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Job Role</label>
                      <input
                        type="text"
                        value={formData.jobRole}
                        onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
                        className="w-full p-3 rounded bg-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full p-3 rounded bg-gray-700 text-white"
                      />
                    </div>
                  </>
                )}
                
                {/* Save and Cancel buttons at bottom of form */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-lg font-semibold transition"
                  >
                    💾 Save Changes
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
                        occupationType: user?.occupationType || "",
                        university: user?.university || "",
                        jobRole: user?.jobRole || "",
                        company: user?.company || "",
                      });
                      // Reset images to original
                      if (user?.profileImages && Array.isArray(user.profileImages)) {
                        setProfileImages(user.profileImages);
                        setImagePreviews(user.profileImages);
                      } else {
                        setProfileImages([]);
                        setImagePreviews([]);
                      }
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg text-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {taste && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">My Preferences</h2>
            
            {taste.movies && taste.movies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Movies</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.movies.map((movie, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof movie === "object" ? movie.title || movie.name : movie}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.music && taste.music.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Music</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.music.map((artist, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof artist === "object" ? artist.name || artist.title : artist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.shows && taste.shows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.shows.map((show, idx) => (
                    <span
                      key={idx}
                      className="bg-green-600 px-3 py-1 rounded text-sm"
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
              <p className="text-gray-400">No preferences set yet. <button onClick={() => navigate("/age-preference")} className="text-blue-400 hover:underline">Add preferences</button></p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/age-preference")}
            className="bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition flex-1"
          >
            Go to Preference Browsing
          </button>
          <button
            onClick={() => navigate("/match-list")}
            className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex-1"
          >
            View Matches
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
