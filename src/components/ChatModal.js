import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { getMessagesBetweenUsers, addMessage, markMessagesAsRead } from '../database/db';

export default function ChatModal({ visible, onClose, currentUser, chatPartner }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  // Poll for messages when modal is open
  useEffect(() => {
    if (visible && currentUser && chatPartner) {
      loadMessages();
      markAsRead();
      intervalRef.current = setInterval(() => {
        loadMessages();
        markAsRead();
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, currentUser, chatPartner]);

  const markAsRead = async () => {
    if (!currentUser?.id || !chatPartner?.id) return;
    try {
      await markMessagesAsRead({ senderId: chatPartner.id, receiverId: currentUser.id });
    } catch (e) {}
  };

  const loadMessages = async () => {
    if (!currentUser?.id || !chatPartner?.id) return;
    const msgs = await getMessagesBetweenUsers(currentUser.id, chatPartner.id);
    setMessages(msgs);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // Optimistic UI update
    const newMsg = {
      id: 'temp_' + Date.now(),
      senderId: currentUser.id,
      receiverId: chatPartner.id,
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      await addMessage({
        senderId: currentUser.id,
        receiverId: chatPartner.id,
        text: newMsg.text
      });
      loadMessages();
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!chatPartner) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            {chatPartner.photo ? (
              <Image source={{ uri: chatPartner.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{chatPartner.username?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{chatPartner.username}</Text>
              <Text style={styles.userRole}>{chatPartner.role === 'admin' ? 'Administrateur' : 'Client'}</Text>
            </View>
          </View>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser.id;
            return (
              <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                  {item.text}
                </Text>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Commencez la discussion ! 👋</Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrivez un message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A18',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    paddingRight: 16,
  },
  backText: {
    color: '#FFF',
    fontSize: 32,
    lineHeight: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C3FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#00FF88',
    fontSize: 12,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C3FFF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: '#E2E8F0',
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    minHeight: 40,
    marginRight: 12,
  },
  sendBtn: {
    backgroundColor: '#6C3FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
  },
  sendText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
