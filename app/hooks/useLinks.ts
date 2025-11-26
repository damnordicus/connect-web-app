import { useState } from "react";

export function useLinks(initialLinks: {label: string, link: string}[]) {
    const [links, setLinks] = useState(initialLinks || [])
    const [showAddLink, setShowAddLink] = useState(false);
    const [newLink, setNewLink] = useState<{ label: string, link: string }>({ label: '', link: '' })
    const [existingLinks, setExistingLinks] = useState<{ label: string, link: string }[]>(initialLinks ?? [])
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedLink, setEditedLink] = useState<{ label: string, link: string }>({ label: '', link: '' })
    const [update, setUpdate] = useState(false);

    function startEditLink(index: number, link: { label: string, link: string }) {
    setEditingIndex(index);
    setEditedLink({ ...link });
  }

  function saveEditedLink(index: number) {
    const existingLinksLength = existingLinks.length;

    if (index < existingLinksLength) {
      setExistingLinks(prev => {
        const updated = [...prev];
        updated[index] = editedLink;
        return updated;
      });
    } else {
      setLinks(prev => {
        const updated = [...prev];
        updated[index - existingLinksLength] = editedLink;
        return updated;
      });
    }


    setEditingIndex(null);
    setEditedLink({ label: '', link: '' });
    setUpdate(true);
  }

  function deleteLink(index: number) {
    const existingLinksLength = existingLinks.length;

    if (index < existingLinksLength) {
      setExistingLinks(prev => prev.filter((_, i) => i !== index));
    } else {
      setLinks(prev => prev.filter((_, i) => i !== (index - existingLinksLength)));
    }

    setUpdate(true);
  }

  function handleAddLink() {
    if (newLink.label !== "" && newLink.link !== "") {
      setLinks((prev) => [...prev, newLink]);
      setNewLink({ label: "", link: "" });
      setShowAddLink(false);
    }
  }

    return {
        links,
        handleAddLink,
        saveEditedLink,
        startEditLink,
        deleteLink,
        setEditedLink,
        setEditingIndex,
        setShowAddLink,
        newLink,
        setNewLink,
        showAddLink,
        editedLink,
        editingIndex,
        existingLinks,
        update,
    }
}