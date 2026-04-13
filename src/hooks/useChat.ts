import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatRoom {
  id: string;
  name: string | null;
  type: "direct" | "group";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_room_id: string;
  user_id: string;
  joined_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useChat() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's chat rooms
  const fetchChatRooms = useCallback(async () => {
    if (!user) {
      setChatRooms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get chat rooms where user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from("chat_participants")
        .select("chat_room_id")
        .eq("user_id", user.id);

      if (participationsError) {
        console.error("Error fetching participations:", participationsError);
        setError(participationsError.message);
        return;
      }

      if (!participations || participations.length === 0) {
        setChatRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = participations.map((p) => p.chat_room_id);
      
      const { data: rooms, error: roomsError } = await supabase
        .from("chat_rooms")
        .select("*")
        .in("id", roomIds)
        .order("updated_at", { ascending: false });

      if (roomsError) {
        console.error("Error fetching chat rooms:", roomsError);
        setError(roomsError.message);
        return;
      }

      // Cast type to match our interface
      const typedRooms = (rooms || []).map(room => ({
        ...room,
        type: room.type as "direct" | "group",
      }));

      setChatRooms(typedRooms);
    } catch (err) {
      console.error("Error in fetchChatRooms:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new chat room
  const createChatRoom = useCallback(async (name: string | null, type: "direct" | "group", participantIds: string[]) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Create the room
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          name,
          type,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) {
        console.error("Error creating chat room:", roomError);
        throw roomError;
      }

      // Add creator as participant
      const participants = [user.id, ...participantIds.filter(id => id !== user.id)];
      
      const { error: participantsError } = await supabase
        .from("chat_participants")
        .insert(
          participants.map((userId) => ({
            chat_room_id: room.id,
            user_id: userId,
          }))
        );

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
        throw participantsError;
      }

      await fetchChatRooms();
      return room;
    } catch (err) {
      console.error("Error in createChatRoom:", err);
      throw err;
    }
  }, [user, fetchChatRooms]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  return {
    chatRooms,
    loading,
    error,
    createChatRoom,
    fetchChatRooms,
  };
}

export function useChatMessages(chatRoomId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for a chat room
  const fetchMessages = useCallback(async () => {
    if (!chatRoomId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_room_id", chatRoomId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setError(messagesError.message);
        return;
      }

      // Fetch sender profiles using public_profiles view (excludes sensitive fields)
      const senderIds = [...new Set((data || []).map((m) => m.sender_id))];
      
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", senderIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const messagesWithProfiles = (data || []).map((m) => ({
          ...m,
          sender_profile: profileMap.get(m.sender_id) || null,
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Error in fetchMessages:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [chatRoomId, user]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!chatRoomId || !user) {
      setParticipants([]);
      return;
    }

    try {
      const { data, error: participantsError } = await supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", chatRoomId);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
        return;
      }

      // Fetch participant profiles using public_profiles view (excludes sensitive fields)
      const userIds = (data || []).map((p) => p.user_id);
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const participantsWithProfiles = (data || []).map((p) => ({
          ...p,
          profile: profileMap.get(p.user_id) || null,
        }));

        setParticipants(participantsWithProfiles);
      } else {
        setParticipants(data || []);
      }
    } catch (err) {
      console.error("Error in fetchParticipants:", err);
    }
  }, [chatRoomId, user]);

  // Send a message
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!chatRoomId || !user || !content.trim()) {
      return null;
    }

    try {
      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content: content.trim(),
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (sendError) {
        console.error("Error sending message:", sendError);
        throw sendError;
      }

      return data;
    } catch (err) {
      console.error("Error in sendMessage:", err);
      throw err;
    }
  }, [chatRoomId, user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!chatRoomId || !user) return;

    fetchMessages();
    fetchParticipants();

    // Subscribe to new messages
    const channel: RealtimeChannel = supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          
          const newMessage = payload.new as Message;
          
          // Fetch sender profile for the new message using public_profiles view
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("user_id, display_name, avatar_url")
            .eq("user_id", newMessage.sender_id)
            .maybeSingle();

          const messageWithProfile = {
            ...newMessage,
            sender_profile: profile || null,
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, messageWithProfile];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          console.log("Message updated:", payload);
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          console.log("Message deleted:", payload);
          const deletedMessage = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== deletedMessage.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, user, fetchMessages, fetchParticipants]);

  return {
    messages,
    participants,
    loading,
    error,
    sendMessage,
    fetchMessages,
  };
}

// Hook for online presence
export function useChatPresence(chatRoomId: string | null) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { user_id: string; display_name: string; online_at: string }>>(new Map());

  useEffect(() => {
    if (!chatRoomId || !user) return;

    const channel = supabase.channel(`presence:${chatRoomId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = new Map<string, { user_id: string; display_name: string; online_at: string }>();
        
        Object.values(state).forEach((presences) => {
          (presences as unknown as Array<{ user_id: string; display_name: string; online_at: string }>).forEach((presence) => {
            if (presence.user_id) {
              users.set(presence.user_id, presence);
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name || "User",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, user, profile]);

  return { onlineUsers };
}
