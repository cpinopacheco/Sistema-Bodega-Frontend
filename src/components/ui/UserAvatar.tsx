import { FaUser, FaShieldAlt } from "react-icons/fa";
import { getProfilePhotoUrl } from "../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  role: "admin" | "user";
  section: string;
  profilePhoto?: string | null;
}

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  showRole?: boolean;
  className?: string;
}

const UserAvatar = ({
  user,
  size = "md",
  showRole = false,
  className = "",
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const photoUrl = getProfilePhotoUrl(user.profilePhoto);

  if (photoUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <img
          src={photoUrl || "/placeholder.svg"}
          alt={`Foto de perfil de ${user.name}`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-primary-lightest`}
          onError={(e) => {
            // Si la imagen falla al cargar, mostrar el ícono por defecto
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
        />
        {/* Fallback icon (hidden by default) */}
        <div
          className={`${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center absolute top-0 left-0`}
          style={{ display: "none" }}
        >
          {showRole && user.role === "admin" ? (
            <FaShieldAlt className={`text-neutral-white ${iconSizes[size]}`} />
          ) : (
            <FaUser className={`text-neutral-white ${iconSizes[size]}`} />
          )}
        </div>
      </div>
    );
  }

  // Si no hay foto, mostrar el ícono por defecto
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center ${className}`}
    >
      {showRole && user.role === "admin" ? (
        <FaShieldAlt className={`text-neutral-white ${iconSizes[size]}`} />
      ) : (
        <FaUser className={`text-neutral-white ${iconSizes[size]}`} />
      )}
    </div>
  );
};

export default UserAvatar;
