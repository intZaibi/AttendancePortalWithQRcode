"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Profile({user}) {
  // State to manage the image URL
  const [imageURL, setImageURL] = useState("/default-removebg-preview.png");
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(`/api/profile?userId=${user?.userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log('Profile image got from API:',data)
  
        setImageURL(data?.profilePicture || '/default-removebg-preview.png');
        
      } catch (error) {
        console.log(error)
      }
    };

    fetchProfilePicture();
  }, [user, imageURL]);



  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("File is too large. Maximum size is 500KB.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImageURL = await uploadImageToCloudinary(file);
      await saveProfilePicture(uploadedImageURL, user?.userId);
      setImageURL(uploadedImageURL);
    } catch (error) {
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle image upload to Cloudinary
  const uploadImageToCloudinary = async (imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "EcommerceProducts");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dw7f5p4lf/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const data = await res.json();
      console.log('Uploaded URL to cloudinary:',data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  // function to upload image to DB
  const saveProfilePicture = async (imageURL, userId) => {
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageURL,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Profile picture saved to DB successfully:", data);
      } else {
        const data = await response.json();
        alert("Failed to save profile picture");
        throw data.message;
      }
    } catch (error) {
      console.error("Error saving profile picture:", error);
      alert("Error saving profile picture");
    }
  };

  return (
    <div className="mx-auto p-4 md:p-6 lg:p-8 bg-gray-200 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold mb-4">Student Profile</h2>

      <div className="flex flex-col lg:flex-row gap-12">
        <h2 className="text-lg font-bold mb-4">Profile Picture</h2>

        <div className="ml-10">
          <Image
            src={imageURL}
            alt="Profile Picture"
            className="w-36 h-36 rounded-2xl object-cover"
            width={500}
            height={500}
          />
        </div>

        <div className="mt-7">
          {/* File input for uploading image */}
          <input
            type="file"
            accept="image/jpeg, image/png"
            className="hidden"
            id="fileInput"
            onChange={handleImageChange}
          />
          <label
            htmlFor="fileInput"
            className="bg-[#00cc6d] hover:bg-[#00cc88] text-white font-semibold py-2 px-4 rounded-xl cursor-pointer focus:outline-none focus:shadow-outline"
          >
            {isUploading
              ? "Uploading..."
              : imageURL === "/default-removebg-preview.png"
              ? "Upload"
              : "Update"}
          </label>
          <p className="my-1">
            Select jpg, jpeg, or png files. Max size: 500KB
          </p>
        </div>
      </div>
    </div>
  );
}
