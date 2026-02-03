import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { cn } from "@thrifty/utils";

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

const initialsFor = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48, className }) => {
  const initials = initialsFor(name);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showImage = Boolean(uri) && !failed;
  return (
    <View
      className={cn(
        "items-center justify-center rounded-full bg-surface-alt border border-white/10",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text className="text-sm font-semibold text-white">{initials}</Text>
      )}
    </View>
  );
};
