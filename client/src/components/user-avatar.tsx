import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserAvatarProps = {
  user: User;
  className?: string;
};

export function UserAvatar({ user, className = "" }: UserAvatarProps) {
  // Generate initials from user's fullName
  const getInitials = () => {
    if (!user.fullName) return "?";
    
    const names = user.fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Define background color based on user role
  const getBgColor = () => {
    switch (user.role) {
      case "admin":
        return "bg-primary text-white";
      case "doctor":
        return "bg-blue-100 text-primary";
      case "receptionist":
        return "bg-secondary text-white";
      case "patient":
        return "bg-blue-100 text-primary";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <Avatar className={className}>
      <AvatarFallback className={getBgColor()}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
