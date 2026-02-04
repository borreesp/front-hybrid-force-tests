import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { cn } from "@thrifty/utils";
import { getInitials } from "../utils/initials";

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48, className }) => {
  const initials = getInitials(name);
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
