const bcrypt = require("bcryptjs");
const { supabase } = require("../lib/supabase");

// Create a new conversation row, title starts null until generated
async function createConversation(title, user_id) {
  const { data, error } = await supabase
    .from("conversation")
    .insert({ title, user_id })
    .select()
    .single();
  if (error) throw error;
  return data; // { conversation_id, title, created_at }
}

// Get or create a conversation by session ID
async function getOrCreateConversation(sessionId) {
  let { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (!convo) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ session_id: sessionId })
      .select()
      .single();
    if (error) throw error;
    convo = data;
  }

  return convo;
}

// Load message history for a conversation
async function getMessages(conversationId, limit = 20) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Save a message
async function saveMessage(conversationId, role, content) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content });

  if (error) throw error;

  // Updates the conversation's updated_at timestamp
  await supabase
    .from("conversation")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId);
}

// Update conversation title
async function updateConversationTitle(conversationId, title) {
  const { error } = await supabase
    .from("conversation")
    .update({ title })
    .eq("conversation_id", conversationId);
  if (error) throw error;
}

// Finding all conversations for a user
async function findById(user_id) {
  const { data, error } = await supabase
    .from("conversation")
    .select("conversation_id, title, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  // console.log("conversations found in findById:", data);
  return data;
}

// Finding a conversation by its ID
async function findByConversationId(conversationId) {
  const { data, error } = await supabase
    .from("conversation")
    .select("conversation_id, title, created_at")
    .eq("conversation_id", conversationId)
    .single();

  if (error) throw new Error(error.message);
  return data;

  if (error) throw new Error(error.message);
  // console.log("conversations found in findById:", data);
  return data;
}

// Finding a messages by its conversation ID
async function findMessagesByConversationId(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId);

  if (error) throw new Error(error.message);
  return data;

  if (error) throw new Error(error.message);
  // console.log("conversations found in findById:", data);
  return data;
}

module.exports = {
  createConversation,
  getOrCreateConversation,
  getMessages,
  saveMessage,
  updateConversationTitle,
  findById,
  findByConversationId,
  findMessagesByConversationId,
};
