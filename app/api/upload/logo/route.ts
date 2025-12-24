import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route pour uploader le logo d'entreprise
 * POST /api/upload/logo
 * 
 * Upload le logo dans Supabase Storage (bucket: "Logos")
 * et sauvegarde logo_path + logo_url dans profiles
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API][upload-logo] POST - Début upload");
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API][upload-logo] POST - Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié", details: authError?.message },
        { status: 401 }
      );
    }

    console.log("[API][upload-logo] POST - User authentifié:", user.id);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("[API][upload-logo] POST - Aucun fichier fourni");
      return NextResponse.json(
        { error: "Aucun fichier fourni", details: "Le champ 'file' est requis" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      console.error("[API][upload-logo] POST - Type non autorisé:", file.type);
      return NextResponse.json(
        { error: "Format de fichier non supporté", details: "Utilisez PNG, JPG ou SVG." },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("[API][upload-logo] POST - Fichier trop volumineux:", file.size);
      return NextResponse.json(
        { error: "Fichier trop volumineux", details: "Taille maximum : 5MB." },
        { status: 400 }
      );
    }

    // Récupérer l'ancien logo_path pour le supprimer après
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("logo_path, logo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    // Si le profil n'existe pas, le créer
    if (!profile) {
      console.log("[API][upload-logo] POST - Profil inexistant, création...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          plan: "free",
        })
        .select("logo_path, logo_url")
        .single();

      if (createError) {
        console.error("[API][upload-logo] POST - Erreur création profil:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la création du profil", details: createError.message },
          { status: 500 }
        );
      }

      profile = newProfile;
    } else if (profileError) {
      console.error("[API][upload-logo] POST - Erreur récupération profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du profil", details: profileError.message },
        { status: 500 }
      );
    }

    const oldLogoPath = profile?.logo_path;

    // Générer un nom de fichier selon les spécifications: userId/logo-timestamp.extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${user.id}/logo-${Date.now()}.${fileExtension}`;

    console.log("[API][upload-logo] POST - Upload fichier:", fileName);

    // Convertir le fichier en ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload dans Supabase Storage (bucket: "Logos")
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Logos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[API][upload-logo] POST - Erreur Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload du logo", details: uploadError.message },
        { status: 500 }
      );
    }

    console.log("[API][upload-logo] POST - Fichier uploadé avec succès");

    // Générer l'URL publique
    const { data: urlData } = supabase.storage
      .from("Logos")
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;
    console.log("[API][upload-logo] POST - URL publique générée:", logoUrl);

    // Sauvegarder logo_path ET logo_url dans profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        logo_path: fileName,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[API][upload-logo] POST - Erreur mise à jour profiles:", updateError);
      // Nettoyer: supprimer le fichier uploadé si la DB échoue
      await supabase.storage.from("Logos").remove([fileName]);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du logo", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("[API][upload-logo] POST - Profil mis à jour avec logo_path et logo_url");

    // Supprimer l'ancien logo si il existe
    if (oldLogoPath) {
      try {
        await supabase.storage.from("Logos").remove([oldLogoPath]);
        console.log("[API][upload-logo] POST - Ancien logo supprimé:", oldLogoPath);
      } catch (cleanupError) {
        // Ne pas faire échouer l'upload si la suppression de l'ancien logo échoue
        console.warn("[API][upload-logo] POST - Erreur lors de la suppression de l'ancien logo:", cleanupError);
      }
    }

    console.log("[API][upload-logo] POST - Upload réussi");

    return NextResponse.json({
      logoUrl,
    });
  } catch (error: any) {
    console.error("[API][upload-logo] POST - Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du logo", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route pour supprimer le logo d'entreprise
 * DELETE /api/upload/logo
 * 
 * Supprime le logo de Supabase Storage et met à jour profiles
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("[API][upload-logo] DELETE - Début suppression");
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API][upload-logo] DELETE - Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié", details: authError?.message },
        { status: 401 }
      );
    }

    console.log("[API][upload-logo] DELETE - User authentifié:", user.id);

    // Récupérer le logo_path actuel
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("logo_path, logo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[API][upload-logo] DELETE - Erreur récupération profil:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du profil", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      console.log("[API][upload-logo] DELETE - Profil inexistant");
      return NextResponse.json(
        { error: "Aucun logo à supprimer", details: "Le profil n'existe pas" },
        { status: 400 }
      );
    }

    if (!profile.logo_path) {
      console.log("[API][upload-logo] DELETE - Pas de logo_path");
      return NextResponse.json(
        { error: "Aucun logo à supprimer", details: "Aucun logo_path trouvé" },
        { status: 400 }
      );
    }

    const logoPath = profile.logo_path;
    console.log("[API][upload-logo] DELETE - Suppression logo:", logoPath);

    // Supprimer le fichier de Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("Logos")
      .remove([logoPath]);

    if (storageError) {
      console.error("[API][upload-logo] DELETE - Erreur suppression Storage:", storageError);
      // Continuer quand même pour mettre à jour la DB
    } else {
      console.log("[API][upload-logo] DELETE - Logo supprimé de Storage");
    }

    // Mettre à jour profiles pour retirer logo_path ET logo_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        logo_path: null,
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[API][upload-logo] DELETE - Erreur mise à jour profiles:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du logo", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("[API][upload-logo] DELETE - Suppression réussie");

    return NextResponse.json({
      success: true,
      message: "Logo supprimé avec succès",
    });
  } catch (error: any) {
    console.error("[API][upload-logo] DELETE - Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du logo", details: error.message },
      { status: 500 }
    );
  }
}
