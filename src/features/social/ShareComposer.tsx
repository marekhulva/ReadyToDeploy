import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, Image, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { GlassSurface } from '../../ui/GlassSurface';
import { useStore } from '../../state/rootStore';
import { Visibility } from '../../state/slices/uiSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ShareComposer: React.FC = () => {
  const shareOpen = useStore(s=>s.shareOpen);
  const draft = useStore(s=>s.shareDraft);
  const close = useStore(s=>s.closeShare);
  const addPost = useStore(s=>s.addPost);
  const setFeedView = useStore(s=>s.setFeedView);

  const [text, setText] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string|undefined>(undefined);
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = React.useState<string|undefined>(undefined);
  const [visibility, setVisibility] = React.useState<Visibility>('circle');
  const [busy, setBusy] = React.useState(false);
  
  // Use a ref to track the text value as a workaround for web
  const textRef = React.useRef('');

  React.useEffect(()=> {
    if (shareOpen && draft) {
      // Only reset when opening, not on every render
      setText(draft?.text || (draft?.promptSeed ? draft?.promptSeed + ' ' : ''));
      setPhotoUri(draft?.photoUri);
      setAudioUri(draft?.audioUri);
      setVisibility(draft?.visibility || 'circle');
    } else if (!shareOpen) {
      // Clear when closing
      setText('');
      setPhotoUri(undefined);
      setAudioUri(undefined);
      setVisibility('circle');
    }
  }, [shareOpen, draft?.promptSeed]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64:false, allowsEditing:true, quality:0.9 });
    if (!res.canceled && res.assets?.[0]?.uri) setPhotoUri(res.assets[0].uri);
  };

  const startRecording = async () => {
    setBusy(true);
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e) { console.warn(e); }
    setBusy(false);
  };
  const stopRecording = async () => {
    if (!recording) return;
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || undefined;
      setAudioUri(uri);
    } catch(e) { console.warn(e); }
    setRecording(null);
    setBusy(false);
  };

  const publish = async () => {
    if (!draft) return;
    const type = draft.type;
    
    // Use the ref value which should have the latest text
    const finalText = textRef.current || text;
    
    console.log('Current text state:', text);
    console.log('Text from ref:', textRef.current);
    console.log('Draft:', draft);
    
    const content = finalText?.trim() || (type==='checkin' ? `Checked in: ${draft.actionTitle}` : '');
    
    console.log('Publishing post with content:', content);
    console.log('Text from input:', finalText);
    
    const post = {
      type,
      visibility,
      content,
      mediaUrl: photoUri || audioUri || undefined,
      photoUri: type==='photo' || photoUri ? photoUri : undefined,
      audioUri: type==='audio' || audioUri ? audioUri : undefined,
      actionTitle: draft.actionTitle,
      goalTitle: draft.goal,
      streak: draft.streak,
      goalColor: draft.goalColor,
    };
    
    console.log('Full post object:', post);
    
    // Call the async addPost function to save to backend
    await addPost(post as any);
    
    // Fetch updated feeds to show the new post
    const fetchFeeds = useStore.getState().fetchFeeds;
    await fetchFeeds();
    
    // show in selected tab
    setFeedView(visibility);
    close();
  };

  return (
    <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <GlassSurface style={styles.sheet}>
          <Text style={styles.title}>Share</Text>
          {/* Visibility toggle */}
          <View style={styles.row}>
            {(['circle','follow'] as Visibility[]).map(v => (
              <Pressable key={v} onPress={()=>setVisibility(v)} style={[styles.visPill, visibility===v && styles.visActive]}>
                <Text style={[styles.visText, visibility===v && styles.visActiveText]}>{v==='circle'?'Circle':'Follow'}</Text>
              </Pressable>
            ))}
          </View>

          {/* Context (for check-ins) */}
          {draft?.type==='checkin' && (
            <View style={[styles.context, draft.goalColor ? { borderColor: draft.goalColor+'33' } : null]}>
              <Text style={styles.contextTitle}>{draft.actionTitle}</Text>
              {!!draft.goal && <Text style={styles.contextMeta}>{draft.goal} • 🔥 {draft.streak ?? 0}</Text>}
            </View>
          )}

          {/* Text */}
          <TextInput
            defaultValue=""
            onChangeText={(newText) => {
              console.log('Text changed to:', newText);
              setText(newText);
              textRef.current = newText; // Also update ref
            }}
            onEndEditing={(e) => {
              console.log('End editing with text:', e.nativeEvent.text);
              setText(e.nativeEvent.text);
              textRef.current = e.nativeEvent.text;
            }}
            placeholder={draft?.promptSeed ?? "Add a note..."}
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline={true}
            numberOfLines={4}
            style={styles.input}
            autoFocus={false}
            editable={true}
            keyboardType="default"
          />

          {/* Photo preview */}
          {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
          {/* Audio hint */}
          {audioUri && <Text style={styles.audioHint}>🎙️ Audio attached</Text>}

          {/* Actions */}
          <View style={styles.toolsRow}>
            <Pressable onPress={pickImage} style={styles.toolBtn}><Text style={styles.toolText}>🖼️ Photo</Text></Pressable>
            {recording 
              ? <Pressable disabled={busy} onPress={stopRecording} style={styles.toolBtn}><Text style={styles.toolText}>⏹ Stop</Text></Pressable>
              : <Pressable disabled={busy} onPress={startRecording} style={styles.toolBtn}><Text style={styles.toolText}>🎙️ Record</Text></Pressable>}
          </View>

          <View style={styles.publishRow}>
            <Pressable onPress={close} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
            <Pressable onPress={publish} style={styles.primary}><Text style={styles.primaryText}>Publish</Text></Pressable>
          </View>
          </GlassSurface>
          <Pressable onPress={close} style={{height:40}} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:{ 
    flex: 1,
    backgroundColor:'rgba(0,0,0,0.9)', 
    justifyContent:'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 375 : '100%', // Constrain to phone width on web
    paddingHorizontal: 16,
  },
  sheet:{ 
    padding:16,
  },
  title:{ color:'#FFF', fontWeight:'800', fontSize:18, marginBottom:8 },
  row:{ flexDirection:'row', gap:8, marginBottom:12 },
  visPill:{ flex:1, alignItems:'center', paddingVertical:10, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)' },
  visActive:{ borderColor:'#FFFFFF', backgroundColor:'rgba(255,255,255,0.12)' },
  visText:{ color:'rgba(255,255,255,0.8)', fontWeight:'700' },
  visActiveText:{ color:'#000', backgroundColor:'#FFF', paddingHorizontal:8, borderRadius:999 },
  context:{ borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)', borderRadius:16, padding:12, marginBottom:12 },
  contextTitle:{ color:'#FFF', fontWeight:'700' },
  contextMeta:{ color:'rgba(255,255,255,0.7)', marginTop:4 },
  input:{ minHeight:100, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:16, padding:12, color:'#FFF', backgroundColor:'rgba(255,255,255,0.05)', marginBottom:12 },
  photo:{ width:'100%', height:220, borderRadius:16, marginBottom:10 },
  audioHint:{ color:'#ECEDEF', marginBottom:8 },
  toolsRow:{ flexDirection:'row', gap:8, marginBottom:10 },
  toolBtn:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.06)' },
  toolText:{ color:'#FFF', fontWeight:'700' },
  publishRow:{ flexDirection:'row', gap:10, marginTop:4 },
  primary:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, backgroundColor:'#FFF' },
  primaryText:{ color:'#000', fontWeight:'800' },
  secondary:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)' },
  secondaryText:{ color:'#FFF', fontWeight:'800' },
});